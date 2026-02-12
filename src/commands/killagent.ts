import {
  type APIChatInputApplicationCommandInteraction,
  ApplicationCommandType,
  InteractionType,
  InteractionResponseType,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { DEFAULT_EMBED_COLOR, PATREON_MESSAGE } from "../constants";
import { gql } from "../common/crom";
import { localizationMap } from "../util/locale";
import { httpsify, formatRating, createImageCdnUrl } from "../util/formatting";
import { ATTRIBUTION_EMBED_INFO, formatAttributions } from "../util/attribution-list";
import KILL_AGENTS from "../data/kill-agents";
import type {
  KillAgentSourceInfoQuery,
  KillAgentSourceInfoQueryVariables,
} from "../__generated__/graphql";
import * as messages from "./killagent.intl";

const KILL_AGENT_SOURCE_INFO_QUERY = gql`
  ${ATTRIBUTION_EMBED_INFO}
  query KillAgentSourceInfo($url: URL!, $siteUrl: URL!) {
    wikidotPage(url: $url) {
      url
      title
      rating
      alternateTitles {
        title
      }
      attributions {
        ...AttributionEmbedInfo
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "killagent",
    name_localizations: localizationMap(messages.commandName),
    description: "Respond with a random kill agent from a branch of the SCP wiki",
    description_localizations: localizationMap(messages.commandDescription),
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

  select(interaction): interaction is APIChatInputApplicationCommandInteraction {
    return (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.type === ApplicationCommandType.ChatInput &&
      interaction.data.name === "killagent"
    );
  },

  async handle(_interaction, context) {
    const killAgentIndex = Math.floor(Math.random() * KILL_AGENTS.length);
    // killAgentIndex is guaranteed to be in bounds.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const killAgent = KILL_AGENTS[killAgentIndex]!;

    const { wikidotPage } = await context.cromApi.request<
      KillAgentSourceInfoQuery,
      KillAgentSourceInfoQueryVariables
    >(KILL_AGENT_SOURCE_INFO_QUERY, { url: killAgent.source, siteUrl: context.defaultSite.url });

    if (!wikidotPage) {
      // TODO: Respond to the user
      throw new Error(`${killAgent.source} does not exist in the API!`);
    }

    // Regular title
    let description = `**[${wikidotPage.title}`;

    // Alternate title
    if (wikidotPage.alternateTitles[0]) description += ` — ${wikidotPage.alternateTitles[0].title}`;

    // URL
    description += `](${httpsify(wikidotPage.url)})**`;

    // Rating
    if (typeof wikidotPage.rating === "number") {
      description += ` (${formatRating(wikidotPage.rating)})`;
    }

    // Attributions
    const siteUrl = new URL(wikidotPage.url).origin;
    if (wikidotPage.attributions.length > 0) {
      description += ` by ${formatAttributions({ attributions: wikidotPage.attributions, siteUrl })}.`;
    }

    // Image credits
    description += ` *(Image: `;
    if (killAgent.attribution) {
      if (killAgent.attribution.url) description += `[`;
      description += killAgent.attribution.title;
      if (killAgent.attribution.url) description += `](${killAgent.attribution.url})`;
      description += ` by `;
      if (killAgent.attribution.creatorUrl) description += `[`;
      description += killAgent.attribution.creator;
      if (killAgent.attribution.creatorUrl) description += `](${killAgent.attribution.creatorUrl})`;
      description += `, licensed under `;
      if (killAgent.attribution.licenseUrl) description += `[`;
      description += killAgent.attribution.license;
      if (killAgent.attribution.licenseUrl) description += `](${killAgent.attribution.licenseUrl})`;
    } else {
      description += "unknown";
    }
    description += `)*`;

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        allowed_mentions: { parse: [] },
        embeds: [
          {
            image: { url: createImageCdnUrl(killAgent.url) },
            color: DEFAULT_EMBED_COLOR,
            description,
            footer: {
              text: `#${killAgentIndex + 1} out of ${KILL_AGENTS.length} / ${PATREON_MESSAGE}`,
            },
          },
        ],
      },
    };
  },
});
