import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionType,
  InteractionResponseType,
  MessageFlags,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord-api-types/v10";
import { LRUCache } from "mnemonist";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./search.intl";
import {
  formatRating,
  httpsify,
  formatFullTitle,
  embedColor,
  normalizeUrl,
} from "../util/formatting";
import { autocompleteSites } from "../util/discord-autocomplete";
import { findOption, getInteractionUser } from "../util/discord-interaction";
import { gql } from "../common/crom";
import { PAGE_EMBED_INFO_FRAGMENT, makePageEmbed } from "./embeds/page-embed";
import type {
  PageByUrlQuery,
  PageByUrlQueryVariables,
  SearchPagesQuery,
  SearchPagesQueryVariables,
} from "../__generated__/graphql";
import SITES from "../__generated__/sites";

export const SEARCH_PAGES_QUERY = gql`
  ${PAGE_EMBED_INFO_FRAGMENT}
  query SearchPages($query: String!, $siteUrl: URL!) {
    searchPages_v1(query: $query, siteUrl: $siteUrl) {
      ...PageEmbedInfo
    }
  }
`;

const PAGE_BY_URL_QUERY = gql`
  ${PAGE_EMBED_INFO_FRAGMENT}
  query PageByUrl($url: URL!, $siteUrl: URL!) {
    wikidotPage(url: $url) {
      ...PageEmbedInfo
    }
  }
`;

const FULLSEARCH_HINT = "Can't find what you're looking for? Try /fullsearch.";

const userInvocationCache = new LRUCache<string, { windowStart: number; invocations: number }>(100);
function trackRecentCall(discordId: string): number {
  const invocationInfo = userInvocationCache.get(discordId);
  if (invocationInfo && invocationInfo.windowStart > Date.now() - 20_000) {
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

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "search",
    name_localizations: localizationMap(messages.commandName),
    description: "Search for an article by a search query in the current wiki",
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
        name: "query",
        name_localizations: localizationMap(messages.optionQueryName),
        description: "The query string to search by",
        description_localizations: localizationMap(messages.optionQueryDescription),
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "wiki",
        name_localizations: localizationMap(messages.optionWikiName),
        description: "The wiki to search in",
        description_localizations: localizationMap(messages.optionWikiDescription),
        required: false,
        autocomplete: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "show-all-authors",
        name_localizations: localizationMap(messages.optionShowAllAuthorsName),
        description: "Don't truncate the list of authors in the result",
        description_localizations: localizationMap(messages.optionShowAllAuthorsDescription),
        required: false,
      },
    ],
  },

  select(
    interaction,
  ): interaction is
    | APIChatInputApplicationCommandInteraction
    | APIApplicationCommandAutocompleteInteraction {
    return (
      ((interaction.type === InteractionType.ApplicationCommand &&
        interaction.data.type === ApplicationCommandType.ChatInput) ||
        interaction.type === InteractionType.ApplicationCommandAutocomplete) &&
      interaction.data.name === "search"
    );
  },

  async handle(interaction, context) {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return autocompleteSites(interaction);
    }

    const discordId = getInteractionUser(interaction).id;
    const isUserFrustrated = trackRecentCall(discordId) >= 2;

    const query = findOption(
      // query is required, so the options array will always exist.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      interaction.data.options!,
      "query",
      ApplicationCommandOptionType.String,
      true,
    );
    const showAllAuthors = findOption(
      interaction.data.options,
      "show-all-authors",
      ApplicationCommandOptionType.Boolean,
    );
    const shortName = findOption(
      interaction.data.options,
      "wiki",
      ApplicationCommandOptionType.String,
    );

    if (shortName && !SITES.some((site) => site.shortName === shortName)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*Please select a valid wiki from the suggestions.*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    let site: (typeof SITES)[number];
    if (shortName) {
      const matchedSite = SITES.find((site) => site.shortName === shortName);
      if (!matchedSite) throw new Error(`Site not found: ${shortName}`);
      site = matchedSite;
    } else {
      site = context.defaultSite;
    }

    // If a user typed in a direct link into the query, just treat the command as a
    // pretty embed generator for links.
    if (/^https?:\/\//.test(query) && URL.canParse(query)) {
      const { wikidotPage } = await context.cromApi.request<
        PageByUrlQuery,
        PageByUrlQueryVariables
      >(PAGE_BY_URL_QUERY, { url: normalizeUrl(query), siteUrl: site.url });
      if (wikidotPage) {
        const siteUrl = new URL(wikidotPage.url).origin;
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            allowed_mentions: { parse: [] },
            embeds: [
              makePageEmbed(
                context,
                wikidotPage,
                siteUrl,
                isUserFrustrated ? FULLSEARCH_HINT : undefined,
                showAllAuthors,
              ),
            ],
          },
        };
      } else {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            allowed_mentions: { parse: [] },
            content: `*No page found by that URL. The page either doesn't exist or hasn't been detected yet.*`,
            flags: MessageFlags.Ephemeral,
          },
        };
      }
    }

    const response = await context.cromApi.request<SearchPagesQuery, SearchPagesQueryVariables>(
      SEARCH_PAGES_QUERY,
      { query, siteUrl: site.url },
    );
    const page = response.searchPages_v1[0];

    if (page) {
      const embed = makePageEmbed(
        context,
        page,
        site.url,
        isUserFrustrated ? FULLSEARCH_HINT : undefined,
        showAllAuthors,
      );
      return { type: InteractionResponseType.ChannelMessageWithSource, data: { embeds: [embed] } };
    }

    // API search didn't find anything, so try Typesense's fuzzy match.
    // Don't reach out to Typesense fuzzy match if it's probably an exact SCP number.
    if (!/^\d+$/.exec(query)) {
      try {
        const typesense = await context.typesenseApi.request({ query, page: 1, siteUrl: site.url });

        if (typesense.hits.length > 1) {
          const description = typesense.hits
            .map(({ document, highlights: [highlight] }) => {
              const rating = formatRating(document.rating);
              const url = httpsify(document.url);
              const title =
                (highlight?.field === "title" ? highlight.snippet : document.title) ?? "";
              const alternateTitle =
                highlight?.field === "alternateTitle" ? highlight.snippet : document.alternateTitle;
              return `• [${formatFullTitle(title, alternateTitle)}](${url}) ` + `(${rating})`;
            })
            .join("\n");

          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              allowed_mentions: { parse: [] },
              embeds: [
                {
                  title: "Possible matches",
                  description,
                  color: embedColor(site.url),
                  footer: isUserFrustrated
                    ? { text: FULLSEARCH_HINT }
                    : typesense.found > 5
                      ? { text: `…and ${typesense.found - 5} more` }
                      : undefined,
                },
              ],
            },
          };
        }

        if (typesense.hits.length === 1 && typesense.hits[0]) {
          const { wikidotPage } = await context.cromApi.request<
            PageByUrlQuery,
            PageByUrlQueryVariables
          >(PAGE_BY_URL_QUERY, { url: typesense.hits[0].document.url, siteUrl: site.url });
          if (wikidotPage) {
            return {
              type: InteractionResponseType.ChannelMessageWithSource,
              data: {
                allowed_mentions: { parse: [] },
                embeds: [makePageEmbed(context, wikidotPage, site.url, "🎯 Closest match")],
              },
            };
          }
        }
      } catch {
        // Typesense can be flaky. Fall back to API search without breaking the bot.
      }
    }

    let content = `*No results for "${query}" on "${site.displayName}".*`;
    if (/^\d+$/.exec(query)) {
      // If it's an exact SCP number, it's probably not a typo.
      content += ` *[Waiting for a new article to appear?](<https://crom.avn.sh/docs/crom-for-authors#how-long-does-it-take-for-crom-to-pick-up-changes>)*`;
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content, flags: MessageFlags.Ephemeral, allowed_mentions: { parse: [] } },
    };
  },
});
