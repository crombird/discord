import {
  type APIInteractionResponse,
  type APIMessageApplicationCommandInteraction,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  PermissionFlagsBits,
  Routes,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { getInteractionUser } from "../util/discord-interaction";
import { localizationMap } from "../util/locale";
import * as messages from "./delete-reply.intl";

const UNEXPECTED_ERROR_RESPONSE: APIInteractionResponse = {
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: "*Sorry, this message can't be deleted.*",
    flags: MessageFlags.Ephemeral,
  },
};

export default defineCommand({
  definition: {
    type: ApplicationCommandType.Message,
    name: "Delete reply",
    name_localizations: localizationMap(messages.commandName),
    contexts: [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ],
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
  },

  select(interaction): interaction is APIMessageApplicationCommandInteraction {
    return (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.type === ApplicationCommandType.Message &&
      interaction.data.name === "Delete reply"
    );
  },

  async handle(interaction, context) {
    const targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
    const targetInteraction = targetMessage?.interaction_metadata;

    if (!targetInteraction) {
      return UNEXPECTED_ERROR_RESPONSE;
    }

    const interactionAuthorId = getInteractionUser(interaction).id;
    if (targetInteraction.user.id !== interactionAuthorId) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "_Only command responses created by you can be deleted._",
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    if (
      // We have bot perms in a DM channel.
      interaction.context === InteractionContextType.BotDM ||
      // We were explicitly given view channel perms (usually a legacy
      // installation or to enable role management).
      BigInt(interaction.app_permissions) & PermissionFlagsBits.ViewChannel
    ) {
      // We can use the API delete here! So we don't have that 15 minute limit.
      await context.discordApi.delete(
        Routes.channelMessage(targetMessage.channel_id, targetMessage.id),
      );
    } else {
      // Fall back to the webhook delete strategy.

      // The interaction token is only valid for 15 minutes, so if the message
      // is older than that, we should present a nice error message.
      if (Date.parse(targetMessage.timestamp) < Date.now() - 15 * 60 * 1000) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "_Messages older than 15 minutes can't be deleted in this server._",
            flags: MessageFlags.Ephemeral,
          },
        };
      }

      const interactionToken = context.getInteractionToken(targetInteraction.id);
      if (!interactionToken) {
        return UNEXPECTED_ERROR_RESPONSE;
      }
      await context.discordApi.delete(
        Routes.webhookMessage(interaction.application_id, interactionToken),
      );
    }

    // Delete the ephemeral response as soon as it's sent.
    // A little manual backoff in case 100ms is too fast of a followup.
    void (async () => {
      for (const timeout of [100, 500, 1000, 2000]) {
        await new Promise((resolve) => setTimeout(resolve, timeout));
        try {
          await context.discordApi.delete(
            Routes.webhookMessage(interaction.application_id, interaction.token),
          );
        } catch (err) {
          console.error(err);
        }
        break;
      }
    })();

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      // This message itself will be deleted shortly, so it serves as a "loading" message.
      data: { content: "*Deleting message...*", flags: MessageFlags.Ephemeral },
    };
  },
});
