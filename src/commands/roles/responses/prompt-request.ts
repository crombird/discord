import {
  type APIInteractionResponseCallbackData,
  type APIComponentInMessageActionRow,
  type APIRole,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from "discord-api-types/v10";

import type { ManagedRoleConfigFragment } from "../../../__generated__/graphql";
import { escapeMarkdown } from "../../../util/formatting";
import { CUSTOM_IDS } from "../custom-ids";

export type PromptRequestAction =
  | { type: "PUT"; roleId: string }
  | { type: "PUT_MULTIPLE"; roleIds: string[]; skippedRoleIds: string[]; failedRoleIds: string[] }
  | { type: "DELETE"; roleId: string }
  | { type: "ERROR"; roleId: string }
  | { type: "NOT_MANAGED_BY_CROM"; roleId: string }
  | { type: "LINK_NEEDED"; roleId: string }
  | { type: "INELIGIBLE"; roleId: string };

export interface PromptResponseParams {
  guildRoles: APIRole[];
  memberRoleIds: string[];
  managedRoles: ManagedRoleConfigFragment[];
  lastAction: PromptRequestAction | null;
}

export function promptRequestResponse({
  guildRoles,
  memberRoleIds,
  managedRoles,
  lastAction,
}: PromptResponseParams): APIInteractionResponseCallbackData {
  const assignableRoles = guildRoles
    .toSorted((a, b) => b.position - a.position)
    .filter((role) => {
      return managedRoles.some(({ roleId }) => role.id === roleId);
    });

  let roleSelectComponent: APIComponentInMessageActionRow;
  if (assignableRoles.length > 25) {
    // A StringSelect has a maximum of 25 items. If we have to show more than
    // 25 items, just display a full role selector. We can determine on
    // selection if they're eligible.
    roleSelectComponent = {
      type: ComponentType.RoleSelect,
      custom_id: CUSTOM_IDS.SELECT_REQUEST_ROLE,
      placeholder: lastAction ? "Type to select another role" : "Type to select a role",
    };
  } else {
    roleSelectComponent = {
      type: ComponentType.StringSelect,
      custom_id: CUSTOM_IDS.SELECT_REQUEST_ROLE,
      placeholder: lastAction ? "Select another role" : "Select a role",
      options: assignableRoles.map((role) => {
        return {
          label: role.name,
          value: role.id,
          emoji: memberRoleIds.includes(role.id) ? { name: "✅" } : undefined,
        };
      }),
    };
  }

  let content = "";

  if (lastAction?.type === "PUT_MULTIPLE") {
    if (lastAction.roleIds.length === 0) {
      content = "_You weren't eligible for any new roles._";
    } else {
      content = `_Assigned ${lastAction.roleIds.length} new role${lastAction.roleIds.length === 1 ? "" : "s"}._`;
    }
    if (lastAction.skippedRoleIds.length > 0) {
      content += `\n_Some roles were skipped because they're excluded from "Request all". You can still select these roles individually._`;
    }
    const failedRoleIdCount = lastAction.failedRoleIds.length;
    if (failedRoleIdCount > 0) {
      const singular = failedRoleIdCount === 1;
      content += `\n_However, there ${singular ? "was" : "were"} ${failedRoleIdCount} role${singular ? "" : "s"} that Crom couldn't assign._`;
    }
  } else if (lastAction) {
    const rawRoleName = guildRoles.find((role) => role.id === lastAction.roleId)?.name;
    if (rawRoleName) {
      const roleName = escapeMarkdown(rawRoleName);
      if (lastAction.type === "PUT") {
        content = `_Added the **${roleName}** role._`;
      } else if (lastAction.type === "DELETE") {
        content = `_Removed the **${roleName}** role._`;
      } else if (lastAction.type === "ERROR") {
        content = `_Couldn't assign the **${roleName}** role. Crom may not have permissions to do this._`;
      } else if (lastAction.type === "INELIGIBLE") {
        content = `_You don't meet the requirements for **${roleName}**._`;
      } else if (lastAction.type === "LINK_NEEDED") {
        content = `_You need to **[link your discord and wikidot accounts](https://crom.avn.sh/account)** before you can request this role._`;
      } else if (lastAction.type === "NOT_MANAGED_BY_CROM") {
        content = `_**${roleName}** isn't assignable using this command._`;
      }
    }
  }

  return {
    flags: MessageFlags.Ephemeral,
    content,
    components: [
      { type: ComponentType.ActionRow, components: [roleSelectComponent] },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CUSTOM_IDS.BUTTON_REQUEST_ALL_ROLES,
            label: "Request all",
            emoji: { name: "🪄" },
          },
        ],
      },
    ],
  };
}
