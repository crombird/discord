import * as assert from "node:assert/strict";

import {
  type APIMessageApplicationCommandInteraction,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { gql } from "../common/crom";
import { PAGE_EMBED_INFO_FRAGMENT, makePageEmbed } from "./embeds/page-embed";
import { localizationMap } from "../util/locale";
import * as messages from "./link-to-scp.intl";
import type { PageByUrlQuery, PageByUrlQueryVariables } from "../__generated__/graphql";

// TODO: This command doesn't support international SCPs.

const IGNORE_REGEXES = [/<@!?\d+>/g, /<#\d+>/g, /<@&\d+>/g];
const SCP_REGEXES = [/scp[- ](\d{2,})(?!\d)/i, /(?<![0-9+.])(\d{3,4})(?![0-9%]|\.[0-9])/i];

const PAGE_BY_URL_QUERY = gql`
  ${PAGE_EMBED_INFO_FRAGMENT}
  query PageByUrl($url: URL!, $siteUrl: URL!) {
    wikidotPage(url: $url) {
      ...PageEmbedInfo
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.Message,
    name: "Link to SCP",
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
      interaction.data.name === "Link to SCP"
    );
  },

  async handle(interaction, context) {
    const targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
    assert.ok(targetMessage);

    const slug = extractPageSlug(targetMessage.content);
    if (!slug) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `*No references found.*`, flags: MessageFlags.Ephemeral },
      };
    }

    const { wikidotPage } = await context.cromApi.request<PageByUrlQuery, PageByUrlQueryVariables>(
      PAGE_BY_URL_QUERY,
      {
        url: new URL(slug, context.defaultSite.url).href,
        siteUrl: context.defaultSite.url,
      },
    );

    if (!wikidotPage) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `*No results.*`, flags: MessageFlags.Ephemeral },
      };
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [makePageEmbed(context, wikidotPage, context.defaultSite.url)],
        flags: MessageFlags.Ephemeral,
      },
    };
  },
});

function extractPageSlug(message: string): string | null {
  const cleanMessage = IGNORE_REGEXES.reduce((str, regex) => str.replace(regex, ""), message);
  for (const regex of SCP_REGEXES) {
    const match = cleanMessage.match(regex);
    if (match?.[1]) return `scp-${match[1].padStart(3, "0")}`;
  }
  return null;
}
