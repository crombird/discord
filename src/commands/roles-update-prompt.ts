import {
  type APIMessageApplicationCommandInteraction,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { configurePromptModalResponse } from "./roles/responses/configure-prompt";
import { CUSTOM_IDS } from "./roles/custom-ids";
import { localizationMap } from "../util/locale";
import * as messages from "./roles-update-prompt.intl";

export default defineCommand({
  definition: {
    type: ApplicationCommandType.Message,
    name: "Roles: Update prompt",
    name_localizations: localizationMap(messages.commandName),
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    contexts: [InteractionContextType.Guild],
    integration_types: [ApplicationIntegrationType.GuildInstall],
  },

  select(interaction): interaction is APIMessageApplicationCommandInteraction {
    return (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.type === ApplicationCommandType.Message &&
      interaction.data.name === "Roles: Update prompt"
    );
  },

  handle(interaction) {
    if (!interaction.guild_id || !interaction.member) {
      throw new Error("Command not called in guild?");
    }

    const targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
    const targetInteraction = targetMessage?.interaction_metadata;

    if (
      targetInteraction?.type !== InteractionType.ModalSubmit ||
      !targetMessage?.components?.[0] ||
      !("components" in targetMessage.components[0]) ||
      // HACK: We're just guessing if it's a prompt message based on the button.
      !targetMessage.components[0].components.some(
        (component) =>
          component.type === ComponentType.Button &&
          component.style === ButtonStyle.Primary &&
          component.custom_id === CUSTOM_IDS.BUTTON_REQUEST_ROLES,
      )
    ) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content:
            "_This command is meant to be used on prompt messages created by **/roles prompt**._",
        },
      };
    }

    if (!(BigInt(interaction.app_permissions) & PermissionFlagsBits.ViewChannel)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content:
            "*Crom doesn't have permissions to update its own messages. Run **/roles manage**.*",
        },
      };
    }

    return {
      type: InteractionResponseType.Modal,
      data: configurePromptModalResponse({
        channelId: interaction.channel.id,
        messageId: interaction.data.target_id,
        existingPrompt: targetMessage.content,
      }),
    };
  },
});
