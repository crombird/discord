import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  type APIInteractionResponseCallbackData,
  type APIApplicationCommandOption,
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
import * as messages from "./random.intl";
import {
  autocompleteSites,
  autocompleteTags,
  getFocusedOption,
} from "../util/discord-autocomplete";
import { findOption, getInteractionUser } from "../util/discord-interaction";
import { gql } from "../common/crom";
import { userDependentResponse } from "../util/discord-response";
import { PAGE_EMBED_INFO_FRAGMENT, makePageEmbed } from "./embeds/page-embed";
import type { RandomPageQuery, RandomPageQueryVariables } from "../__generated__/graphql";
import SITES from "../__generated__/sites";

export const RANDOM_PAGE_QUERY = gql`
  ${PAGE_EMBED_INFO_FRAGMENT}
  query RandomPage($siteUrl: URL!, $filter: PageQueryFilter!) {
    randomPage_v1(filter: $filter) {
      ...PageEmbedInfo
    }
    aggregatePages(filter: $filter) {
      _count
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "random",
    name_localizations: localizationMap(messages.commandName),
    description: "Returns a random page from the wiki",
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
          "Filter by tag.",
          'You can also use "not:[tag]", "by:[author-name]", or "crom:series-[N]".',
        ].join(" "),
        description_localizations: localizationMap(messages.optionTagNameDescription),
        required: false,
        autocomplete: true,
      })),
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
        interaction.data.name === "random") ||
      (interaction.type === InteractionType.MessageComponent &&
        interaction.data.custom_id.startsWith("random-"))
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

    let tags: string[];
    let siteUrl: string;
    let inDiary: boolean | undefined;

    if (interaction.type === InteractionType.MessageComponent) {
      let siteIndex: string | undefined;
      let marshaledInDiary: string | undefined;
      // eslint-disable-next-line prefer-const
      [siteIndex, marshaledInDiary, ...tags] = interaction.data.custom_id
        .replace(/^random-/, "")
        .split(",");
      // It's probably fine to trust the custom id we encoded ourselves.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      siteUrl = SITES[parseInt(siteIndex!)]!.url;
      inDiary =
        marshaledInDiary === "true" ? true : marshaledInDiary === "false" ? false : undefined;
    } else {
      const options = interaction.data.options;
      const shortName = findOption(options, "wiki", ApplicationCommandOptionType.String);
      if (shortName) {
        const matchedSite = SITES.find((site) => site.shortName === shortName);
        if (!matchedSite) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `*Select a valid wiki from the suggestions.*`,
              flags: MessageFlags.Ephemeral,
            },
          };
        }
        siteUrl = matchedSite.url;
      } else {
        siteUrl = context.defaultSite.url;
      }
      tags = [1, 2, 3, 4, 5]
        .map((n) => findOption(options, `tag-${n}`, ApplicationCommandOptionType.String))
        .filter(((tag) => typeof tag === "string") as (x: unknown) => x is string);
      inDiary = findOption(options, "in-diary", ApplicationCommandOptionType.Boolean);
    }

    const pageTags = tags.filter((tag) => !/^by[:-]|^not:/.exec(tag.toLowerCase()));

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
    const response = await context.cromApi.request<RandomPageQuery, RandomPageQueryVariables>(
      RANDOM_PAGE_QUERY,
      {
        siteUrl: siteUrl,
        filter: {
          _and: [
            {
              url: { startsWith: siteUrl },
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
        },
      },
    );

    const { randomPage_v1, aggregatePages } = response;
    const matchCount = aggregatePages._count;

    if (!randomPage_v1) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*No results that match your tags.*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    const embed = makePageEmbed(
      context,
      randomPage_v1,
      siteUrl,
      tags.length > 0
        ? `${matchCount.toLocaleString()} ${matchCount > 1 ? "matches" : "match"}`
        : `picked from ${matchCount.toLocaleString()} pages`,
    );

    const diaryPageLink = `https://crom.avn.sh/diary?${new URLSearchParams({ page: randomPage_v1.url }).toString()}`;
    const content =
      (tags.length > 0 ? "🏷️ **" + tags.map((t) => `\`${t}\``).join(" + ") + "**" : "") +
      (inDiary === true ? `\n🔖 **_In [my diary](${diaryPageLink})_**` : "") +
      (inDiary === false ? `\n🔖 **_Not in [my diary](https://crom.avn.sh/diary)_**` : "");

    const siteIndex = SITES.findIndex((s) => s.url === siteUrl);
    const customId =
      "random-" +
      [siteIndex, inDiary === true ? "true" : inDiary === false ? "false" : "", ...tags].join(",");
    const data: APIInteractionResponseCallbackData = {
      // These are valid tags on the wiki, so content-wise, we're safe to print it as user input.
      content: content || undefined,
      embeds: [embed],
    };

    if (matchCount > 1) {
      data.components = [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id: customId.length > 100 ? "" : customId,
              disabled: customId.length > 100,
              emoji: { name: "🎲" },
              label: customId.length > 100 ? `Reroll (Use fewer tags)` : "Reroll",
            },
          ],
        },
      ];
    }

    return userDependentResponse(interaction, data);
  },
});
