import pLimit from "p-limit";

import { changeMemberRole } from "./guild-roles";
import { checkEligiblity } from "./eligibility";
import type { CromClient } from "../../../common/crom";
import type { CrawlerClient } from "../../../common/crawler";
import type { RESTWithTypeParameters } from "../../../common/discord";
import type { ManagedRoleConfigFragment } from "../../../__generated__/graphql";

export interface BulkAssignParams {
  cromApi: CromClient;
  crawlerApi: CrawlerClient;
  discordApi: RESTWithTypeParameters;
  bulkAction: "ASSIGN" | "UNASSIGN";
  managedRoles: ManagedRoleConfigFragment[];
  guildRoleIds: string[];
  memberRoleIds: string[];
  guildId: string;
  memberId: string;
}

export interface BulkAssignReturn {
  added: string[];
  skippedAdd: string[];
  removed: string[];
  failed: string[];
}

export async function bulkAssign({
  cromApi,
  crawlerApi,
  discordApi,
  guildId,
  memberId,
  guildRoleIds,
  memberRoleIds,
  managedRoles,
  bulkAction,
}: BulkAssignParams): Promise<BulkAssignReturn> {
  const added: string[] = [];
  const skippedAdd: string[] = [];
  const removed: string[] = [];
  const failed: string[] = [];

  const limit = pLimit(1);
  await Promise.all(
    guildRoleIds.map(async (roleId) => {
      // Skip unnecessary network calls if the role is already in the desired state.
      if (bulkAction === "ASSIGN" && memberRoleIds.includes(roleId)) return;
      if (bulkAction === "UNASSIGN" && !memberRoleIds.includes(roleId)) return;

      // Get the managed role assigned to this role.
      // If the role isn't managed, maybe it was set to no longer be managed by Crom.
      const managedRole = managedRoles.find((r) => r.roleId === roleId);
      if (!managedRole) return;

      // If the role config specifically specifies skipping bulk assignments, skip it.
      if (
        bulkAction === "ASSIGN" &&
        managedRole.config.__typename === "DiscordGuildManagedRoleOpenConfig" &&
        managedRole.config.disableAutoAssign
      ) {
        skippedAdd.push(roleId);
        return;
      }

      const newAction = await checkEligiblity(cromApi, crawlerApi, memberId, managedRole.config);

      if (newAction === "ERROR") {
        failed.push(roleId);
      } else if (bulkAction === "ASSIGN" && newAction === "PUT") {
        try {
          await limit(() => changeMemberRole(discordApi, guildId, memberId, roleId, "PUT"));
          added.push(roleId);
        } catch {
          failed.push(roleId);
        }
      } else if (
        bulkAction === "UNASSIGN" &&
        (newAction === "INELIGIBLE" || newAction === "LINK_NEEDED")
      ) {
        try {
          await limit(() => changeMemberRole(discordApi, guildId, memberId, roleId, "DELETE"));
          removed.push(roleId);
        } catch {
          failed.push(roleId);
        }
      }
    }),
  );

  return { added, skippedAdd, removed, failed };
}
