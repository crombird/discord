import * as assert from "node:assert/strict";

import {
  type APIChatInputApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  type APIModalSubmitInteraction,
  ApplicationCommandType,
  InteractionType,
  PermissionFlagsBits,
  InteractionContextType,
  InteractionResponseType,
  ComponentType,
  MessageFlags,
  ApplicationCommandOptionType,
  Routes,
  ApplicationIntegrationType,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./roles.intl";
import { changeMemberRole, getGuildRoles } from "./roles/util/guild-roles";
import type {
  DeleteManagedRoleMutation,
  DeleteManagedRoleMutationVariables,
  DiscordGuildManagedRoleConfigInput,
  GetGuildRolesQuery,
  GetGuildRolesQueryVariables,
  UpdateManagedRoleMutation,
  UpdateManagedRoleMutationVariables,
} from "../__generated__/graphql";
import { manageResponse } from "./roles/responses/manage";
import { promptResponse } from "./roles/responses/prompt";
import { promptRequestResponse } from "./roles/responses/prompt-request";
import {
  configureAuthorshipModalResponse,
  parseAuthorshipModalInteraction,
} from "./roles/responses/configure-authorship";
import {
  configureMembershipModalResponse,
  parseMembershipModalInteraction,
} from "./roles/responses/configure-membership";
import {
  DELETE_MANAGED_ROLE_MUTATION,
  GET_GUILD_ROLES_QUERY,
  UPDATE_MANAGED_ROLE_MUTATION,
} from "./roles/queries";
import { checkEligiblity } from "./roles/util/eligibility";
import {
  configurePromptModalResponse,
  parsePromptModalInteraction,
} from "./roles/responses/configure-prompt";
import { CUSTOM_ID_PREFIX, CUSTOM_IDS } from "./roles/custom-ids";
import { updateInitialResponse } from "../util/discord-response";
import { bulkAssign } from "./roles/util/bulk-assign";

const REINSTALL_URL =
  "https://discord.com/oauth2/authorize?client_id=418818217016819749&permissions=268436480&integration_type=0&scope=bot%20applications.commands";

const DEFAULT_OPEN_CONFIG: DiscordGuildManagedRoleConfigInput = {
  discordGuildManagedRoleOpenConfig: {
    disableAutoAssign: false,
  },
};

const DEFAULT_OPEN_NO_AUTO_ASSIGN_CONFIG: DiscordGuildManagedRoleConfigInput = {
  discordGuildManagedRoleOpenConfig: {
    disableAutoAssign: true,
  },
};

const DEFAULT_MEMBER_CONFIG: DiscordGuildManagedRoleConfigInput = {
  discordGuildManagedRoleMemberConfig: {
    wikiUrl: "http://scp-wiki.wikidot.com",
  },
};

const DEFAULT_PAGES_CONFIG: DiscordGuildManagedRoleConfigInput = {
  discordGuildManagedRolePageConfig: {
    minPageCount: 1,
    siteUrls: ["http://scp-wiki.wikidot.com"],
    withTags: [],
    excludeTags: [],
  },
};

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "roles",
    name_localizations: localizationMap(messages.commandName),
    description: "Allow Crom to auto-assign roles for server members based on wiki association",
    description_localizations: localizationMap(messages.commandDescription),
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    contexts: [InteractionContextType.Guild],
    integration_types: [ApplicationIntegrationType.GuildInstall],
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "manage",
        name_localizations: localizationMap(messages.optionManageName),
        description: "Manage assignment criteria for each role",
        description_localizations: localizationMap(messages.optionManageDescription),
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "prompt",
        name_localizations: localizationMap(messages.optionPromptName),
        description: "Create a prompt message for role selection",
        description_localizations: localizationMap(messages.optionPromptDescription),
      },
    ],
  },

  select(
    interaction,
  ): interaction is
    | APIChatInputApplicationCommandInteraction
    | APIMessageComponentInteraction
    | APIModalSubmitInteraction {
    // Calling the original slash command
    if (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.type === ApplicationCommandType.ChatInput &&
      interaction.data.name === "roles"
    ) {
      return true;
    }

    // Calling a message component or modal submission
    // (all custom ids are prefixed with `CUSTOM_ID_PREFIX`)
    if (
      (interaction.type === InteractionType.MessageComponent ||
        interaction.type === InteractionType.ModalSubmit) &&
      interaction.data.custom_id.startsWith(CUSTOM_ID_PREFIX + "-")
    ) {
      return true;
    }

    return false;
  },

  async handle(interaction, context) {
    if (!interaction.guild_id || !interaction.member) {
      throw new Error("Command called outside guild!");
    }

    // Reinstall prompt if Crom can't manage roles
    if (!canManageRoles(interaction.app_permissions)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content:
            `*Crom doesn't have the permissions to manage roles in this server.* ` +
            (canInstallApps(interaction.member.permissions)
              ? `*Reinstall the app by clicking **[here](${REINSTALL_URL})**.*`
              : `*Ask an administrator to run this command to configure the necessary permissions.*`),
        },
      };
    }

    // Initial slash command responses
    if (interaction.type === InteractionType.ApplicationCommand) {
      const subcommand = interaction.data.options?.[0];
      if (subcommand?.type !== ApplicationCommandOptionType.Subcommand) {
        throw new Error("Unexpected state - missing subcommand!");
      }

      //
      // /roles manage
      // Prints an empty role management UI.
      //
      if (subcommand.name === "manage") {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: manageResponse({ selectedRoleId: null, selectedManagedRole: null }),
        };
      }

      //
      // /roles prompt
      // Prints a publicly viewable role selector message.
      //
      if (subcommand.name === "prompt") {
        return {
          type: InteractionResponseType.Modal,
          data: configurePromptModalResponse({
            existingPrompt: null,
            channelId: null,
            messageId: null,
          }),
        };
      }
    }

    // Fetch all managed roles for the current guild
    // All future commands will need this.
    const {
      discordGuildInfo: { managedRoles },
    } = await context.cromApi.request<GetGuildRolesQuery, GetGuildRolesQueryVariables>(
      GET_GUILD_ROLES_QUERY,
      {
        guildId: interaction.guild_id,
      },
    );

    //
    // /roles prompt (request button pressed)
    //
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.Button &&
      interaction.data.custom_id === CUSTOM_IDS.BUTTON_REQUEST_ROLES
    ) {
      const guildRoles = await getGuildRoles(context.discordApi, interaction.guild_id);
      const memberRoleIds = interaction.member.roles;

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: promptRequestResponse({ managedRoles, guildRoles, memberRoleIds, lastAction: null }),
      };
    }

    //
    // /roles prompt (role selected)
    //
    if (
      interaction.type === InteractionType.MessageComponent &&
      (interaction.data.component_type === ComponentType.RoleSelect ||
        interaction.data.component_type === ComponentType.StringSelect) &&
      interaction.data.custom_id === CUSTOM_IDS.SELECT_REQUEST_ROLE
    ) {
      const roleId = interaction.data.values[0];
      if (!roleId) throw new Error("Unexpected state - role select unselected");

      const guildRoles = await getGuildRoles(context.discordApi, interaction.guild_id);
      const memberRoleIds = interaction.member.roles;

      // If Crom doesn't manage this role, bail early with an error.
      // The role isn't presented in the string select, but it is in the role select.
      const managedRole = managedRoles.find((role) => role.roleId === roleId);
      if (!managedRole) {
        return {
          type: InteractionResponseType.UpdateMessage,
          data: promptRequestResponse({
            managedRoles,
            guildRoles,
            memberRoleIds,
            lastAction: { type: "NOT_MANAGED_BY_CROM", roleId },
          }),
        };
      }

      try {
        // If the user has the role already, unassign it.
        if (memberRoleIds.includes(roleId)) {
          await changeMemberRole(
            context.discordApi,
            interaction.guild_id,
            interaction.member.user.id,
            roleId,
            "DELETE",
          );
          return {
            type: InteractionResponseType.UpdateMessage,
            data: promptRequestResponse({
              managedRoles,
              guildRoles,
              memberRoleIds: memberRoleIds.filter((memberRoleId) => memberRoleId !== roleId),
              lastAction: { type: "DELETE", roleId },
            }),
          };
        }

        void (async (guildId, memberId) => {
          try {
            // Otherwise, if the user is eligible to receive the role, assign it.
            const action = await checkEligiblity(
              context.cromApi,
              context.crawlerApi,
              memberId,
              managedRole.config,
            );
            if (action === "PUT") {
              await changeMemberRole(context.discordApi, guildId, memberId, roleId, "PUT");
              await updateInitialResponse(
                context.discordApi,
                interaction,
                promptRequestResponse({
                  managedRoles,
                  guildRoles,
                  memberRoleIds: [...memberRoleIds, roleId],
                  lastAction: { type: "PUT", roleId },
                }),
              );
              return;
            }

            // Otherwise, print a response with the relevant failure message.
            await updateInitialResponse(
              context.discordApi,
              interaction,
              promptRequestResponse({
                managedRoles,
                guildRoles,
                memberRoleIds,
                lastAction: { type: action, roleId },
              }),
            );
            return;
          } catch (err) {
            console.error(err);
            return updateInitialResponse(
              context.discordApi,
              interaction,
              promptRequestResponse({
                managedRoles,
                guildRoles,
                memberRoleIds: memberRoleIds.filter((memberRoleId) => memberRoleId !== roleId),
                lastAction: { type: "ERROR", roleId },
              }),
            );
          }
        })(interaction.guild_id, interaction.member.user.id);

        return { type: InteractionResponseType.DeferredMessageUpdate };
      } catch (err) {
        console.error(err);
        return {
          type: InteractionResponseType.UpdateMessage,
          data: promptRequestResponse({
            managedRoles,
            guildRoles,
            memberRoleIds: memberRoleIds.filter((memberRoleId) => memberRoleId !== roleId),
            lastAction: { type: "ERROR", roleId },
          }),
        };
      }
    }

    //
    // /roles prompt (submitted modal)
    //
    if (
      interaction.type === InteractionType.ModalSubmit &&
      interaction.data.custom_id.startsWith(CUSTOM_IDS.MODAL_PROMPT)
    ) {
      const prompt = parsePromptModalInteraction(interaction.data);
      const lastPart = interaction.data.custom_id.split("-").at(-1);
      if (lastPart?.includes("/")) {
        const [channelId, messageId] = lastPart.split("/");
        assert.ok(channelId && messageId);
        await context.discordApi.patch(Routes.channelMessage(channelId, messageId), {
          body: { content: prompt },
        });
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            flags: MessageFlags.Ephemeral,
            content: "_Updated prompt message._",
          },
        };
      }

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: promptResponse({ prompt }),
      };
    }

    //
    // /roles prompt (select all roles button pressed)
    //
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.Button &&
      interaction.data.custom_id === CUSTOM_IDS.BUTTON_REQUEST_ALL_ROLES
    ) {
      void (async (guildId, memberId, memberRoleIds) => {
        const guildRoles = await getGuildRoles(context.discordApi, guildId);
        const {
          added: addedRoleIds,
          skippedAdd: skippedRoleIds,
          failed: failedRoleIds,
        } = await bulkAssign({
          cromApi: context.cromApi,
          crawlerApi: context.crawlerApi,
          discordApi: context.discordApi,
          bulkAction: "ASSIGN",
          guildId,
          memberId,
          guildRoleIds: guildRoles.map((r) => r.id),
          memberRoleIds,
          managedRoles,
        });

        return updateInitialResponse(
          context.discordApi,
          interaction,
          promptRequestResponse({
            guildRoles,
            managedRoles,
            memberRoleIds: [...memberRoleIds, ...addedRoleIds],
            lastAction: {
              type: "PUT_MULTIPLE",
              roleIds: addedRoleIds,
              skippedRoleIds,
              failedRoleIds,
            },
          }),
        );
      })(interaction.guild_id, interaction.member.user.id, interaction.member.roles);

      return {
        type: InteractionResponseType.DeferredMessageUpdate,
      };
    }

    //
    // /roles manage (role selected)
    //
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.RoleSelect &&
      interaction.data.custom_id === CUSTOM_IDS.SELECT_MANAGE_ROLE
    ) {
      if (!interaction.data.values[0]) {
        return {
          type: InteractionResponseType.UpdateMessage,
          data: manageResponse({ selectedRoleId: null, selectedManagedRole: null }),
        };
      }

      const discordRole = interaction.data.resolved.roles[interaction.data.values[0]];
      assert.ok(discordRole);
      const managedRole = managedRoles.find((role) => role.roleId === discordRole.id);
      return {
        type: InteractionResponseType.UpdateMessage,
        data: manageResponse({
          selectedRoleId: discordRole.id,
          selectedManagedRole: managedRole ?? null,
        }),
      };
    }

    //
    // /roles manage (config selected)
    //
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.StringSelect &&
      interaction.data.custom_id.startsWith(CUSTOM_IDS.SELECT_MANAGE_CONFIG)
    ) {
      const roleId = interaction.data.custom_id.split("-").at(-1);
      assert.ok(roleId); // Trusting our own custom ID format.

      // Update API immediately (with default values for each type)
      const configType = interaction.data.values[0];
      if (configType === "not-managed") {
        await context.cromApi.request<
          DeleteManagedRoleMutation,
          DeleteManagedRoleMutationVariables
        >(DELETE_MANAGED_ROLE_MUTATION, { input: { roleId } });
        return {
          type: InteractionResponseType.UpdateMessage,
          data: manageResponse({
            selectedRoleId: roleId,
            selectedManagedRole: null,
          }),
        };
      }

      // Generate default GraphQL input values for initial selection
      let config: DiscordGuildManagedRoleConfigInput;
      if (configType === "pages") {
        config = DEFAULT_PAGES_CONFIG;
      } else if (configType === "open") {
        config = DEFAULT_OPEN_CONFIG;
      } else if (configType === "open-no-auto-assign") {
        config = DEFAULT_OPEN_NO_AUTO_ASSIGN_CONFIG;
      } else if (configType === "membership") {
        config = DEFAULT_MEMBER_CONFIG;
      } else {
        throw new Error("Unknown selection");
      }

      const {
        updateDiscordGuildManagedRole: { discordGuildManagedRole },
      } = await context.cromApi.request<
        UpdateManagedRoleMutation,
        UpdateManagedRoleMutationVariables
      >(UPDATE_MANAGED_ROLE_MUTATION, { input: { roleId, guildId: interaction.guild_id, config } });

      return {
        type: InteractionResponseType.UpdateMessage,
        data: manageResponse({
          selectedRoleId: roleId,
          selectedManagedRole: discordGuildManagedRole,
        }),
      };
    }

    //
    // /roles manage (configure clicked for a preselected preset and role)
    // Opens a modal. The contents depend on the type of the preset selected.
    //
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.Button &&
      interaction.data.custom_id.startsWith(CUSTOM_IDS.BUTTON_MANAGE_CONFIGURE)
    ) {
      const roleId = interaction.data.custom_id.split("-").at(-1);
      assert.ok(roleId); // Trusting our own custom ID format.

      const managedRole = managedRoles.find((role) => role.roleId === roleId);
      if (!managedRole) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            flags: MessageFlags.Ephemeral,
            content:
              "*Crom couldn't find this role in its configuration " +
              "for some reason. Try selecting the role again.*",
          },
        };
      }
      if (managedRole.config.__typename === "DiscordGuildManagedRolePageConfig") {
        return {
          type: InteractionResponseType.Modal,
          data: configureAuthorshipModalResponse({ roleId, roleConfig: managedRole.config }),
        };
      } else if (managedRole.config.__typename === "DiscordGuildManagedRoleMemberConfig") {
        return {
          type: InteractionResponseType.Modal,
          data: configureMembershipModalResponse({ roleId, roleConfig: managedRole.config }),
        };
      }
    }

    //
    // /roles manage (submitted authorship modal)
    //
    if (
      interaction.type === InteractionType.ModalSubmit &&
      interaction.data.custom_id.startsWith(CUSTOM_IDS.MODAL_CONFIGURE_AUTHORSHIP)
    ) {
      const roleId = interaction.data.custom_id.split("-").at(-1);
      assert.ok(roleId);
      const config = parseAuthorshipModalInteraction(interaction.data);
      await context.cromApi.request<UpdateManagedRoleMutation, UpdateManagedRoleMutationVariables>(
        UPDATE_MANAGED_ROLE_MUTATION,
        { input: { roleId, config, guildId: interaction.guild_id } },
      );

      return {
        type: InteractionResponseType.UpdateMessage,
        data: manageResponse({
          selectedRoleId: roleId,
          selectedManagedRole: managedRoles.find((role) => role.roleId === roleId) ?? null,
        }),
      };
    }

    //
    // /roles manage (submitted membership modal)
    //
    if (
      interaction.type === InteractionType.ModalSubmit &&
      interaction.data.custom_id.startsWith(CUSTOM_IDS.MODAL_CONFIGURE_MEMBERSHIP)
    ) {
      const roleId = interaction.data.custom_id.split("-").at(-1);
      assert.ok(roleId); // Trusting our own custom ID format.
      const config = parseMembershipModalInteraction(interaction.data);
      await context.cromApi.request<UpdateManagedRoleMutation, UpdateManagedRoleMutationVariables>(
        UPDATE_MANAGED_ROLE_MUTATION,
        { input: { roleId, config, guildId: interaction.guild_id } },
      );

      return {
        type: InteractionResponseType.UpdateMessage,
        data: manageResponse({
          selectedRoleId: roleId,
          selectedManagedRole: managedRoles.find((role) => role.roleId === roleId) ?? null,
        }),
      };
    }

    throw new Error(`Unexpected interaction type: ${interaction.type}`);
  },
});

function canManageRoles(bitfield: string): boolean {
  return !!(
    BigInt(bitfield) &
    (PermissionFlagsBits.ManageRoles | PermissionFlagsBits.Administrator)
  );
}

function canInstallApps(bitfield: string): boolean {
  return !!(
    BigInt(bitfield) &
    (PermissionFlagsBits.ManageGuild | PermissionFlagsBits.Administrator)
  );
}
