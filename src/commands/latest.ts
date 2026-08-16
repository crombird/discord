import * as assert from "node:assert/strict";

import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  type APIEmbed,
  type APIInteractionResponseCallbackData,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionType,
  InteractionResponseType,
  MessageFlags,
  ComponentType,
  ButtonStyle,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord-api-types/v10";
import { formatDistanceToNow } from "date-fns";
import { LRUCache } from "mnemonist";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./latest.intl";
import { autocompleteSites } from "../util/discord-autocomplete";
import { findOption, getInteractionUser } from "../util/discord-interaction";
import { gql } from "../common/crom";
import { userDependentResponse } from "../util/discord-response";
import { isAdultTag, isArtworkTag } from "../util/tags";
import { ACTIVE_CONTEST_TAGS, PATREON_MESSAGE } from "../constants";
import {
  embedColor,
  escapeMarkdown,
  formatFullTitle,
  formatRating,
  httpsify,
  shouldShowPatreonMessage,
} from "../util/formatting";
import { ATTRIBUTION_EMBED_INFO, formatAttributions } from "../util/attribution-list";
import type { LastCreatedQuery, LastCreatedQueryVariables } from "../__generated__/graphql";
import SITES from "../__generated__/sites";

const COMPANION_HINT =
  "Waiting for a newly-posted article to appear? Try Companion (https://crom.avn.sh/docs/companion)";

const userInvocationCache = new LRUCache<string, { windowStart: number; invocations: number }>(100);
function trackRecentCall(discordId: string): number {
  const invocationInfo = userInvocationCache.get(discordId);
  if (invocationInfo && invocationInfo.windowStart > Date.now() - 300_000) {
    const newInvocationCount = invocationInfo.invocations + 1;
    userInvocationCache.set(discordId, {
      windowStart: invocationInfo.windowStart,
      invocations: newInvocationCount,
    });
    return newInvocationCount;
  }
  userInvocationCache.set(discordId, { windowStart: Date.now(), invocations: 1 });
  return 1;
}

export const LAST_CREATED_QUERY = gql`
  ${ATTRIBUTION_EMBED_INFO}
  query LastCreated(
    $siteUrl: URL!
    $siteUrlPrefix: String!
    $cutoffTime: DateTime!
    $first: Int
    $after: ID
    $last: Int
    $before: ID
  ) {
    pages(
      first: $first
      after: $after
      last: $last
      before: $before
      sort: { key: WIKIDOT_CREATED_AT, order: DESC }
      filter: {
        _and: [
          { url: { startsWith: $siteUrlPrefix } }
          { onWikidotPage: { isHidden: { eq: false } } }
          {
            _or: [
              { onWikidotPage: { createdAt: { gte: $cutoffTime } } }
              { onWikidotPage: { createdAt: { lt: $cutoffTime }, rating: { gte: 0 } } }
            ]
          }
        ]
      }
    ) {
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          __typename
          url
          attributions {
            ...AttributionEmbedInfo
          }
          alternateTitles {
            title
          }
          ... on WikidotPage {
            title
            rating
            createdAt
            tags
          }
        }
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "latest",
    name_localizations: localizationMap(messages.commandName),
    description: `List the five most recently created pages on the server's wiki`,
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
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "wiki",
        name_localizations: localizationMap(messages.optionWikiName),
        description: "An optional wiki to look in",
        description_localizations: localizationMap(messages.optionWikiDescription),
        required: false,
        autocomplete: true,
      },
    ],
  },

  select(
    interaction,
  ): interaction is
    | APIChatInputApplicationCommandInteraction
    | APIMessageComponentInteraction
    | APIApplicationCommandAutocompleteInteraction {
    return (
      (((interaction.type === InteractionType.ApplicationCommand &&
        interaction.data.type === ApplicationCommandType.ChatInput) ||
        interaction.type === InteractionType.ApplicationCommandAutocomplete) &&
        interaction.data.name === "latest") ||
      (interaction.type === InteractionType.MessageComponent &&
        interaction.data.custom_id.startsWith("latest-"))
    );
  },

  async handle(interaction, context) {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return autocompleteSites(interaction);
    }

    let direction = 1; // 1: Forwards, 2: Backwards
    let hasPatreon = shouldShowPatreonMessage() ? 1 : 0;
    let siteIndex: number;
    let shortCursor: string | null = null;
    let isExplicitRefresh = 0;

    if (interaction.type === InteractionType.ApplicationCommand) {
      const shortName = findOption(
        interaction.data.options,
        "wiki",
        ApplicationCommandOptionType.String,
      );
      if (shortName && !SITES.some((site) => site.shortName === shortName)) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `*Select a valid wiki from the suggestions.*`,
            flags: MessageFlags.Ephemeral,
          },
        };
      }
      siteIndex = shortName
        ? SITES.findIndex((site) => site.shortName === shortName)
        : SITES.findIndex((site) => site.url === context.defaultSite.url);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [direction, hasPatreon, siteIndex, shortCursor, isExplicitRefresh] = JSON.parse(
        interaction.data.custom_id.replace(/^latest-/, ""),
      );
    }

    const site = SITES[siteIndex];
    assert.ok(site, "Invalid site index");

    // Track if the user is likely checking for a new page to appear.
    const isCheckAttempt =
      interaction.type === InteractionType.ApplicationCommand || isExplicitRefresh === 1;
    const discordId = getInteractionUser(interaction).id;
    const shouldShowCompanionPrompt = isCheckAttempt && trackRecentCall(discordId) >= 2;

    const response = await context.cromApi.request<LastCreatedQuery, LastCreatedQueryVariables>(
      LAST_CREATED_QUERY,
      {
        ...(direction === 1
          ? { first: 5, after: shortCursor && sealShortId(shortCursor) }
          : { last: 5, before: shortCursor && sealShortId(shortCursor) }),
        siteUrl: site.url,
        siteUrlPrefix: site.url,
        cutoffTime: new Date(Date.now() - 3_600_000).toISOString(),
      },
    );

    const description = response.pages.edges
      .map(({ node: page }) => {
        assert.equal(page.__typename, "WikidotPage", "Unexpected non-Wikidot page");
        const title = formatFullTitle(page.title, page.alternateTitles[0]?.title);
        const rating = page.rating;
        const hideRating = page.tags.some((tag) =>
          ACTIVE_CONTEST_TAGS.some((contest) => contest.tag === tag),
        );
        const postingDistance = formatDistanceToNow(new Date(page.createdAt), {
          includeSeconds: true,
          addSuffix: true,
          locale: context.dateFnsLocale,
        });
        return [
          page.tags.some(isAdultTag) ? "🔞 " : "",
          page.tags.some(isArtworkTag) ? "🖼️ " : "",
          `**[${escapeMarkdown(title)}](${httpsify(page.url)})**`,
          typeof rating === "number" && !hideRating ? ` (**${formatRating(rating)}**)` : "",
          `  \n`,
          `_posted **${postingDistance}** by_ `,
          formatAttributions({
            attributions: page.attributions,
            siteUrl: site.url,
            italicised: true,
          }),
        ].join("");
      })
      .join("\n");

    const embed: APIEmbed = {
      title: "Most recently created",
      url: site.recentlyCreatedUrl ?? undefined,
      color: embedColor(site.url),
      footer: shouldShowCompanionPrompt
        ? { text: COMPANION_HINT }
        : hasPatreon
          ? { text: PATREON_MESSAGE }
          : undefined,
      description,
    };

    const disableBackwardsPagination =
      // We're paginating forwards and we're at the beginning
      (direction === 1 && shortCursor === null) ||
      // We're paginating backwards and there's no previous page
      (direction === 2 && !response.pages.pageInfo.hasPreviousPage);

    const data: APIInteractionResponseCallbackData = {
      allowed_mentions: { parse: [] },
      content: site.url !== context.defaultSite.url ? `📝 **${site.displayName}**` : undefined,
      embeds: [embed],
    };

    if (
      interaction.type !== InteractionType.ApplicationCommand ||
      response.pages.pageInfo.hasNextPage
    ) {
      data.components = [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id:
                "latest-" +
                JSON.stringify([
                  1,
                  hasPatreon,
                  siteIndex,
                  null,
                  disableBackwardsPagination ? 1 : 0,
                ]),
              emoji: { name: disableBackwardsPagination ? "🔁" : "⏮️" },
              label: disableBackwardsPagination ? "Refresh" : "First",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id:
                "latest-" +
                JSON.stringify([
                  2,
                  hasPatreon,
                  siteIndex,
                  response.pages.pageInfo.startCursor &&
                    unsealOpaqueId(response.pages.pageInfo.startCursor),
                  0,
                ]),
              disabled: disableBackwardsPagination,
              emoji: { name: "◀️" },
              label: "Previous",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id:
                "latest-" +
                JSON.stringify([
                  1,
                  hasPatreon,
                  siteIndex,
                  response.pages.pageInfo.endCursor &&
                    unsealOpaqueId(response.pages.pageInfo.endCursor),
                  0,
                ]),
              disabled:
                // We're paginating forwards and we've run out of pages.
                // If we're paginating backwards, we know a previous page exists.
                direction === 1 && !response.pages.pageInfo.hasNextPage,
              emoji: { name: "▶️" },
              label: "Next",
            },
          ],
        },
      ];
    }

    return userDependentResponse(interaction, data);
  },
});

/**
 * HACK: Try to pull out all scaffolding out of the cursor and shorten the ID as much
 *   as possible to fit it inside ~45 characters. This means that this logic is going
 *   to be very brittle and depend on the query and API server implementation details,
 *   but ¯\_(ツ)_/¯
 */
function unsealOpaqueId(opaqueId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { sortId, id } = JSON.parse(Buffer.from(opaqueId, "base64").toString("utf8"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return `${Date.parse(sortId)}:${id}`;
}

function sealShortId(shortId: string): string {
  const [sortId, id] = shortId.split(":") as [string, string];
  const info = JSON.stringify({
    type: "Page",
    sortKey: "WIKIDOT_CREATED_AT",
    sortId: new Date(parseInt(sortId)).toISOString(),
    id: parseInt(id),
  });
  return Buffer.from(info, "utf8").toString("base64");
}
