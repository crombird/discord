import {
  type APIUserApplicationCommandInteraction,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./roles-reevaluate.intl";
import { GET_GUILD_ROLES_QUERY } from "./roles/queries";
import { bulkAssign } from "./roles/util/bulk-assign";
import { getGuildRoles } from "./roles/util/guild-roles";
import type { GetGuildRolesQuery, GetGuildRolesQueryVariables } from "../__generated__/graphql";

export default defineCommand({
  definition: {
    type: ApplicationCommandType.User,
    name: "Roles: Re-evaluate for user",
    name_localizations: localizationMap(messages.commandName),
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    contexts: [InteractionContextType.Guild],
    integration_types: [ApplicationIntegrationType.GuildInstall],
  },

  select(interaction): interaction is APIUserApplicationCommandInteraction {
    return (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.type === ApplicationCommandType.User &&
      interaction.data.name === "Roles: Re-evaluate for user"
    );
  },

  async handle(interaction, context) {
    const memberId = interaction.data.target_id;
    const memberRoleIds = interaction.data.resolved.members?.[memberId]?.roles;
    if (!interaction.guild_id) throw new Error("Command not called in guild?");
    if (!memberRoleIds) throw new Error("Could not get member roles?");

    const guildRoles = await getGuildRoles(context.discordApi, interaction.guild_id);

    const {
      discordGuildInfo: { managedRoles },
    } = await context.cromApi.request<GetGuildRolesQuery, GetGuildRolesQueryVariables>(
      GET_GUILD_ROLES_QUERY,
      { guildId: interaction.guild_id },
    );

    const { removed, failed } = await bulkAssign({
      cromApi: context.cromApi,
      crawlerApi: context.crawlerApi,
      discordApi: context.discordApi,
      bulkAction: "UNASSIGN",
      guildRoleIds: guildRoles.map((role) => role.id),
      guildId: interaction.guild_id,
      memberId,
      memberRoleIds,
      managedRoles,
    });

    let content = `_Removed ${removed.length} role${removed.length === 1 ? "" : "s"} from user._`;
    if (failed.length > 0) {
      content += ` _However, ${failed.length} role${failed.length === 1 ? "" : "s"} failed to unassign._`;
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { flags: MessageFlags.Ephemeral, content },
    };
  },
});
