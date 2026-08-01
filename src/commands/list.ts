import * as assert from "node:assert/strict";

import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  type APIInteractionResponseCallbackData,
  type APIApplicationCommandOption,
  type APIApplicationCommandOptionChoice,
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

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./list.intl";
import {
  autocompleteSites,
  autocompleteTags,
  getFocusedOption,
} from "../util/discord-autocomplete";
import { findOption, getInteractionUser } from "../util/discord-interaction";
import { gql } from "../common/crom";
import { PAGE_EMBED_INFO_FRAGMENT, makePageEmbed } from "./embeds/page-embed";
import { userDependentResponse } from "../util/discord-response";
import { ACTIVE_CONTEST_TAGS } from "../constants";
import type { ListPagesQuery, ListPagesQueryVariables, PagesSort } from "../__generated__/graphql";
import SITES from "../__generated__/sites";

const LIST_PAGES_QUERY = gql`
  ${PAGE_EMBED_INFO_FRAGMENT}
  query ListPages($filter: PageQueryFilter!, $sort: PagesSort!, $siteUrl: URL!) {
    pages(filter: $filter, sort: $sort, first: 50) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          ...PageEmbedInfo
        }
      }
    }
    aggregatePages(filter: $filter) {
      _count
    }
  }
`;

const SORTS: { value: PagesSort; choice: APIApplicationCommandOptionChoice<string> }[] = [
  {
    value: { key: "WIKIDOT_TITLE", order: "ASC" },
    choice: {
      name: "title, ascending",
      name_localizations: localizationMap(messages.sortTitleAsc),
      value: "title-asc",
    },
  },
  {
    value: { key: "WIKIDOT_TITLE", order: "DESC" },
    choice: {
      name: "title, descending",
      name_localizations: localizationMap(messages.sortTitleDesc),
      value: "title-desc",
    },
  },
  {
    value: { key: "WIKIDOT_RATING", order: "ASC" },
    choice: {
      name: "rating, ascending",
      name_localizations: localizationMap(messages.sortRatingAsc),
      value: "rating-asc",
    },
  },
  {
    value: { key: "WIKIDOT_RATING", order: "DESC" },
    choice: {
      name: "rating, descending",
      name_localizations: localizationMap(messages.sortRatingDesc),
      value: "rating-desc",
    },
  },
  {
    value: { key: "WIKIDOT_CREATED_AT", order: "ASC" },
    choice: {
      name: "date, ascending",
      name_localizations: localizationMap(messages.sortDateAsc),
      value: "date-asc",
    },
  },
  {
    value: { key: "WIKIDOT_CREATED_AT", order: "DESC" },
    choice: {
      name: "date, descending",
      name_localizations: localizationMap(messages.sortDateDesc),
      value: "date-desc",
    },
  },
];

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "list",
    name_localizations: localizationMap(messages.commandName),
    description: `Page through articles that meet certain criteria.`,
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
      ...[1, 2, 3, 4, 5].map<APIApplicationCommandOption>((n) => ({
        type: ApplicationCommandOptionType.String,
        name: `tag-${n}`,
        name_localizations: localizationMap(messages.optionTagName, { id: n }),
        description: [
          `Filter by tag.`,
          `You can also use "not:[tag]", "by:[author-name]", or "crom:series-[N]".`,
        ].join(" "),
        description_localizations: localizationMap(messages.optionTagNameDescription),
        required: n === 1,
        autocomplete: true,
      })),
      {
        type: ApplicationCommandOptionType.String,
        name: "order",
        name_localizations: localizationMap(messages.optionOrderName),
        description: "The order to return the pages in",
        description_localizations: localizationMap(messages.optionOrderDescription),
        required: false,
        choices: SORTS.map(({ choice }) => choice),
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "in-diary",
        name_localizations: localizationMap(messages.optionInDiaryName),
        description: "Filter pages that are in your Crom account diary",
        description_localizations: localizationMap(messages.optionInDiaryDescription),
        required: false,
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
        interaction.data.name === "list") ||
      (interaction.type === InteractionType.MessageComponent &&
        interaction.data.custom_id.startsWith("list-"))
    );
  },

  async handle(interaction, context) {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const focusedOptionName = getFocusedOption(interaction.data.options)?.name;
      if (focusedOptionName === "wiki") {
        return autocompleteSites(interaction);
      }
      if (focusedOptionName?.startsWith("tag-")) {
        const shortName = findOption(
          interaction.data.options,
          "wiki",
          ApplicationCommandOptionType.String,
        );
        const siteUrl =
          (!!shortName && SITES.find((site) => site.shortName === shortName)?.url) ||
          context.defaultSite.url;
        return autocompleteTags(interaction, context, siteUrl);
      }
      throw new Error(`Invalid focused option: ${focusedOptionName}`);
    }

    let site: (typeof SITES)[number];
    let sort: PagesSort;
    let tags: string[];
    let offset = 0;
    let inDiary: boolean | undefined;

    if (interaction.type === InteractionType.MessageComponent) {
      let siteIndex: number;
      let sortIndex: number;
      let marshaledOffset: number;
      let marshaledInDiary: boolean | undefined;
      // eslint-disable-next-line prefer-const, @typescript-eslint/no-unsafe-assignment
      [marshaledOffset, siteIndex, sortIndex, marshaledInDiary, ...tags] = JSON.parse(
        interaction.data.custom_id.replace(/^list-/, ""),
      );
      const matchedSite = SITES[siteIndex];
      assert.ok(matchedSite, "Invalid site index");
      site = matchedSite;
      const matchedSort = SORTS[sortIndex];
      assert.ok(matchedSort, "Invalid sort index");
      sort = matchedSort.value;
      offset = Math.max(marshaledOffset, 0);
      inDiary = marshaledInDiary;
    } else {
      const shortName = findOption(
        interaction.data.options,
        "wiki",
        ApplicationCommandOptionType.String,
      );
      if (shortName) {
        const matchedSite = SITES.find((site) => site.shortName === shortName);
        if (matchedSite) {
          site = matchedSite;
        } else {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `*Select a valid wiki from the suggestions.*`,
              flags: MessageFlags.Ephemeral,
            },
          };
        }
      }
      site ??= context.defaultSite;

      const sortOption = findOption(
        interaction.data.options,
        "order",
        ApplicationCommandOptionType.String,
      );
      // If sortOption is undefined, we'll get the default sort, which we know is defined.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      sort = SORTS.find((sort) => sort.choice.value === (sortOption ?? "date-desc"))!.value;

      tags = [1, 2, 3, 4, 5]
        .map((n) => {
          return findOption(
            interaction.data.options,
            `tag-${n}`,
            ApplicationCommandOptionType.String,
          );
        })
        .filter(((tag) => typeof tag === "string") as (x: unknown) => x is string);
      inDiary = findOption(
        interaction.data.options,
        "in-diary",
        ApplicationCommandOptionType.Boolean,
      );
    }

    const pageTags = tags.filter((tag) => !/^by[:-]|^not:/.exec(tag.toLowerCase()));

    const contestTag = pageTags.find((tag) =>
      ACTIVE_CONTEST_TAGS.some((contest) => contest.tag === tag),
    );
    if (contestTag && sort.key === "WIKIDOT_RATING") {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*\`${contestTag}\` is a contest tag. It can't be sorted by rating.*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    const excludedTags = tags
      .filter((tag) => tag.toLowerCase().startsWith("not:"))
      .map((tag) => tag.replace(/^not:\s*/, ""));

    const authorTags = tags
      .filter((tag) => /^by[:-]/.exec(tag.toLowerCase()))
      .map((tag) => {
        const lowerCase = tag.toLowerCase();
        if (lowerCase.startsWith("by-")) {
          return lowerCase
            .replace(/^by-/, "")
            .replace(/-+/g, (match) => (match.length === 1 ? " " : "-"));
        }
        return lowerCase.replace(/^by:\s*/, "");
      });

    const interactionUser = getInteractionUser(interaction);
    const filter = {
      _and: [
        {
          url: { startsWith: site.url },
          onWikidotPage: {
            _and: [
              { isHidden: { eq: false } },
              ...pageTags.map((name) => ({ tags: { eq: name } })),
              ...excludedTags.map((name) => ({ _not: { tags: { eq: name } } })),
            ],
          },
          attributions: {
            _and: authorTags.map((name) => ({ user: { displayName: { eqLower: name } } })),
          },
        },
        ...(inDiary === true
          ? [{ inDiaryByDiscordIntegrationId: { eq: interactionUser.id } }]
          : inDiary === false
            ? [{ _not: { inDiaryByDiscordIntegrationId: { eq: interactionUser.id } } }]
            : []),
      ],
    };

    const { pages, aggregatePages } = await context.cromApi.request<
      ListPagesQuery,
      ListPagesQueryVariables
    >(LIST_PAGES_QUERY, {
      sort,
      filter,
      siteUrl: site.url,
    });

    if (pages.edges.length <= offset) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `*No results that match your query.*`, flags: MessageFlags.Ephemeral },
      };
    }

    const displayedPage = pages.edges[offset]?.node;
    assert.ok(displayedPage);
    const embed = makePageEmbed(
      context,
      displayedPage,
      site.url,
      `Result #${offset + 1} of ${aggregatePages._count}`,
    );

    const siteIdx = SITES.indexOf(site);
    const sortIdx = SORTS.findIndex((s) => s.value === sort);

    const firstId = "list-" + JSON.stringify([-1, siteIdx, sortIdx, inDiary, ...tags]);
    const prevId =
      "list-" + JSON.stringify([Math.max(0, offset - 1), siteIdx, sortIdx, inDiary, ...tags]);
    const nextId = "list-" + JSON.stringify([offset + 1, siteIdx, sortIdx, inDiary, ...tags]);
    const unPaginateable = firstId.length > 95 || prevId.length > 95 || nextId.length > 95;

    const diaryPageLink = `https://crom.avn.sh/diary?${new URLSearchParams({ page: displayedPage.url }).toString()}`;
    const data: APIInteractionResponseCallbackData = {
      // These are valid tags on the wiki, so content-wise, we're safe to print it as user input.
      content: [
        ...(tags.length > 0 ? ["🏷️ **" + tags.map((t) => `\`${t}\``).join(" + ") + "**"] : []),
        // We know this exists because it's based on `sort`, which is a list item.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        `${sort.order === "ASC" ? "📈" : "📉"} **\`${SORTS[sortIdx]!.choice.name}\`**`,
        ...(inDiary === true ? [`🔖 **In [my diary](${diaryPageLink})**`] : []),
        ...(inDiary === false ? [`🔖 **Not in [my diary](https://crom.avn.sh/diary)**`] : []),
      ].join("\n"),
      embeds: [embed],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              // Adding an arbitrary number at the end so that this always has a unique ID.
              custom_id: firstId,
              disabled: unPaginateable || offset === 0,
              emoji: { name: "⏮️" },
              label: "First",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id: prevId,
              disabled: unPaginateable || offset === 0,
              emoji: { name: "◀️" },
              label: "Previous",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id: nextId,
              disabled: unPaginateable || offset === pages.edges.length - 1,
              emoji: { name: "▶️" },
              label: unPaginateable
                ? `Next (use fewer tags)`
                : offset === 49
                  ? "Next (limit reached)"
                  : "Next",
            },
          ],
        },
      ],
    };

    return userDependentResponse(interaction, data);
  },
});
