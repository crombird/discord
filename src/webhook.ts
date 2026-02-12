import {
  type APIInteraction,
  InteractionType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import * as Sentry from "@sentry/bun";

import { type Command } from "./common/command";
import { ContextFactory } from "./common/context-factory";
import { getInteractionUser } from "./util/discord-interaction";
import { commandCounter, commandDurationHistogram, errorCounter } from "./metrics";

export function createWebhookHandler(
  discordPublicKey: string,
  commands: Command<APIInteraction>[],
  contextFactory: ContextFactory,
) {
  return async function webhookHandler(request: Request): Promise<Response> {
    const stopTimer = commandDurationHistogram.startTimer();

    // Check presence of webhook signature
    const timestamp = request.headers.get("x-signature-timestamp");
    const signature = request.headers.get("x-signature-ed25519");
    if (!timestamp || !signature) return new Response("No signature", { status: 401 });

    // Read the request body. We can only read the body once, so we can't just
    // call `.json()` after calling `.arrayBuffer()`.
    const arrayBuffer: ArrayBuffer = await request.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);

    // Verify request signature
    const isSignatureValid = await verifyKey(arrayBuffer, signature, timestamp, discordPublicKey);
    if (!isSignatureValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    let interaction: APIInteraction;
    try {
      // Parse JSON (no runtime type checking, let's just assume types are valid)
      interaction = JSON.parse(text) as APIInteraction;
    } catch (err) {
      Sentry.captureException(err);
      return new Response("Invalid JSON", { status: 400 });
    }

    // Reply to pings
    if (interaction.type === InteractionType.Ping) {
      return Response.json({ type: InteractionResponseType.Pong });
    }

    // Find the right command to use.
    const command = commands.find((command) => command.select(interaction));
    if (!command) {
      console.error("Unknown interaction!");
      return new Response(null, { status: 500 });
    }

    commandCounter.inc({ command: command.definition.name });

    try {
      const interactionUser = getInteractionUser(interaction);
      const context = await contextFactory.fetchContext({
        locale: interaction.guild_locale ?? interaction.locale,
        userId: interactionUser.id,
        guildId: interaction.guild_id,
      });
      const response = await command.handle(interaction, context);

      // Track interaction key for future deletions.
      if (
        response.type === InteractionResponseType.ChannelMessageWithSource ||
        response.type === InteractionResponseType.DeferredChannelMessageWithSource
      ) {
        contextFactory.interactionTokenCache.set(interaction.id, interaction.token);
      }

      stopTimer({ command: command.definition.name });
      return Response.json(response);
    } catch (err) {
      console.error(err);
      Sentry.captureException(err, {
        extra: {
          command: command.definition.name,
          interaction,
        },
      });
      errorCounter.inc({ command: command.definition.name });

      return Response.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*Sorry, something went wrong. Please try again later.*`,
          flags: MessageFlags.Ephemeral,
        },
      });
    }
  };
}
