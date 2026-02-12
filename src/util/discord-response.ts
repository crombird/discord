import {
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  type APIInteractionResponseCallbackData,
  type APIInteractionResponseChannelMessageWithSource,
  type APIInteractionResponseUpdateMessage,
  type APIMessageComponentInteraction,
  type RESTPatchAPIWebhookWithTokenMessageJSONBody,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  Routes,
} from "discord-api-types/v10";

import type { RESTWithTypeParameters } from "../common/discord";
import { getInteractionUser } from "./discord-interaction";

export function userDependentResponse(
  interaction: APIChatInputApplicationCommandInteraction | APIMessageComponentInteraction,
  responseData: APIInteractionResponseCallbackData,
): APIInteractionResponseChannelMessageWithSource | APIInteractionResponseUpdateMessage {
  // We want to update an interaction message after a message component was triggered on it.
  // But the person who triggered the message component is different to the person who
  // originally triggered the interaction. So we respond to them only in a new ephemeral embed.
  if (
    interaction.type === InteractionType.MessageComponent &&
    getInteractionUser(interaction).id !== interaction.message.interaction_metadata?.user.id
  ) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { ...responseData, flags: MessageFlags.Ephemeral },
    };
  }

  // This is a user pressing a button on their own interaction. We can safely update this
  // interaction for everyone.
  if (interaction.type === InteractionType.MessageComponent) {
    return { type: InteractionResponseType.UpdateMessage, data: responseData };
  }

  // This is a user just calling the slash command to start with. There's no permissions issue here.
  return { type: InteractionResponseType.ChannelMessageWithSource, data: responseData };
}

export async function updateInitialResponse(
  discordApi: RESTWithTypeParameters,
  interaction: APIInteraction,
  body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
) {
  try {
    await _updateInitialResponse(discordApi, interaction, body);
  } catch (err) {
    console.error(err);
    await _updateInitialResponse(discordApi, interaction, {
      content: "*Sorry, something went wrong. Please try again later.*",
    });
  }
}

async function _updateInitialResponse(
  discordApi: RESTWithTypeParameters,
  interaction: APIInteraction,
  body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
) {
  await discordApi.patch(Routes.webhookMessage(interaction.application_id, interaction.token), {
    body,
  });
}
