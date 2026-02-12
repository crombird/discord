import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIEmbed,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionType,
  InteractionResponseType,
  MessageFlags,
  InteractionContextType,
  ApplicationIntegrationType,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./author.intl";
import {
  searchUser,
  makeAuthorEmbed,
  CHOICES,
  fetchUserInfo,
  type UserEmbedInfoFragment,
} from "./embeds/author-embed";
import { autocompleteFromList } from "../util/discord-autocomplete";
import { findOption } from "../util/discord-interaction";
import { gql } from "../common/crom";
import { embedColor, formatRating } from "../util/formatting";
import type {
  AuthorNamesByRankQuery,
  AuthorNamesByRankQueryVariables,
} from "../__generated__/graphql";
import SITES from "../__generated__/sites";

const AUTHOR_NAMES_BY_RANK_QUERY = gql`
  query AuthorNamesByRank($rank: Int!, $siteUrl: URL) {
    usersByRank_v1(rank: $rank, siteUrl: $siteUrl) {
      id
      displayName
      statistics(siteUrl: $siteUrl) {
        rank
        totalRating
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "author",
    name_localizations: localizationMap(messages.commandName),
    description: "Get information about an author from the server's current wiki",
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
        name: "name-or-rank",
        name_localizations: localizationMap(messages.optionNameOrRankName),
        description: 'Username to search (or a rank if you format it like "#123")',
        description_localizations: localizationMap(messages.optionNameOrRankDescription),
        required: true,
      },
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
    | APIApplicationCommandAutocompleteInteraction {
    return (
      ((interaction.type === InteractionType.ApplicationCommand &&
        interaction.data.type === ApplicationCommandType.ChatInput) ||
        interaction.type === InteractionType.ApplicationCommandAutocomplete) &&
      interaction.data.name === "author"
    );
  },

  async handle(interaction, context) {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return autocompleteFromList(interaction, CHOICES);
    }

    const nameOrRank = findOption(
      // One of the options is required, so the options array will always exist.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      interaction.data.options!,
      "name-or-rank",
      ApplicationCommandOptionType.String,
      true,
    );

    const shortName = findOption(
      interaction.data.options,
      "wiki",
      ApplicationCommandOptionType.String,
    );

    if (shortName && !CHOICES.some(({ value }) => value === shortName)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*Please select a valid wiki from the suggestions.*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    let siteUrl: string | null = null;
    if (shortName && shortName !== "all") {
      const site = SITES.find((site) => site.shortName === shortName);
      // We checked shortName against the choices, so this should never happen.
      if (!site) throw new Error(`Invalid shortName: ${shortName}`);
      siteUrl = site.url;
    } else if (!shortName) {
      siteUrl = context.defaultSite.url;
    }

    let user: UserEmbedInfoFragment | undefined | null;

    if (/^#\d+$/.test(nameOrRank)) {
      const rank = parseInt(nameOrRank.slice(1));
      // Split the fetch into two requests. attributedPages is an expensive
      // nested query, so we want to defer it if we end up getting a bunch of
      // users out of usersByRank_v1.
      const { usersByRank_v1 } = await context.cromApi.request<
        AuthorNamesByRankQuery,
        AuthorNamesByRankQueryVariables
      >(AUTHOR_NAMES_BY_RANK_QUERY, { siteUrl, rank });

      // If we got multiple users with the same rank, print them all and ask
      // the user to pick a single user. We don't need attributedPages for this.
      if (usersByRank_v1.length > 1 && usersByRank_v1[0]?.statistics) {
        const startRank = usersByRank_v1[0].statistics.rank;
        const endRank = startRank + (usersByRank_v1.length - 1);
        const rankRating = formatRating(usersByRank_v1[0].statistics.totalRating);
        const embed: APIEmbed = {
          description: [
            `**There are multiple authors sharing ranks #${startRank} to #${endRank} (${rankRating}).**`,
            ...usersByRank_v1.map((u) => `• ${u.displayName}`),
          ].join("\n"),
          footer: { text: `"/author <username>" for each author` },
          color: embedColor(siteUrl),
        };
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: { embeds: [embed] },
        };
      }

      // If we got a single user, display it the same as a text search.
      if (usersByRank_v1.length === 1 && usersByRank_v1[0]) {
        user = await fetchUserInfo(context.cromApi, usersByRank_v1[0].id, siteUrl);
      }
    } else {
      // This isn't a rank search, so just do a regular search.
      user = await searchUser(context.cromApi, nameOrRank, siteUrl);
    }

    if (!user) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*No results for "${nameOrRank}".*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { embeds: [makeAuthorEmbed(context, user, siteUrl, false)] },
    };
  },
});
