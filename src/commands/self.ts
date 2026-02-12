import * as assert from "node:assert/strict";

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

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./self.intl";
import {
  type UserEmbedInfoFragment,
  CHOICES,
  BASIC_USER_EMBED_INFO_FRAGMENT,
  SITE_SPECIFIC_USER_EMBED_INFO_FRAGMENT,
  ALL_SITES_USER_EMBED_INFO_FRAGMENT,
  searchUser,
  makeAuthorEmbed,
} from "./embeds/author-embed";
import { autocompleteFromList } from "../util/discord-autocomplete";
import { findOption, getInteractionUser } from "../util/discord-interaction";
import { gql } from "../common/crom";
import { escapeMarkdown } from "../util/formatting";
import type {
  SiteSpecificAuthorInfoByDiscordIdQuery,
  SiteSpecificAuthorInfoByDiscordIdQueryVariables,
  AllSitesAuthorInfoByDiscordIdQuery,
  AllSitesAuthorInfoByDiscordIdQueryVariables,
} from "../__generated__/graphql";
import SITES from "../__generated__/sites";

const SITE_SPECIFIC_AUTHOR_INFO_BY_DISCORD_ID_QUERY = gql`
  ${BASIC_USER_EMBED_INFO_FRAGMENT}
  ${SITE_SPECIFIC_USER_EMBED_INFO_FRAGMENT}
  query SiteSpecificAuthorInfoByDiscordId(
    $discordId: String!
    $siteUrl: URL!
    $siteUrlString: String!
  ) {
    discordUserInfo(discordId: $discordId) {
      account {
        wikidotIntegration {
          wikidotUser {
            ...BasicUserEmbedInfo
            ...SiteSpecificUserEmbedInfo
          }
        }
      }
    }
  }
`;

const ALL_SITES_AUTHOR_INFO_BY_DISCORD_ID_QUERY = gql`
  ${BASIC_USER_EMBED_INFO_FRAGMENT}
  ${ALL_SITES_USER_EMBED_INFO_FRAGMENT}
  query AllSitesAuthorInfoByDiscordId($discordId: String!) {
    discordUserInfo(discordId: $discordId) {
      account {
        wikidotIntegration {
          wikidotUser {
            ...BasicUserEmbedInfo
            ...AllSitesUserEmbedInfo
          }
        }
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "self",
    name_localizations: localizationMap(messages.commandName),
    description: "Get information about your wiki account from the server's current wiki",
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
    | APIApplicationCommandAutocompleteInteraction {
    return (
      ((interaction.type === InteractionType.ApplicationCommand &&
        interaction.data.type === ApplicationCommandType.ChatInput) ||
        interaction.type === InteractionType.ApplicationCommandAutocomplete) &&
      interaction.data.name === "self"
    );
  },

  async handle(interaction, context) {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return autocompleteFromList(interaction, CHOICES);
    }

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
      const matchedSite = SITES.find((site) => site.shortName === shortName);
      assert.ok(matchedSite, "Invalid shortName");
      siteUrl = matchedSite.url;
    } else if (!shortName) {
      siteUrl = context.defaultSite.url;
    }

    const discordUser = getInteractionUser(interaction);
    let user: UserEmbedInfoFragment | undefined | null;
    let isLinked = false;

    // By linked user name
    let response: SiteSpecificAuthorInfoByDiscordIdQuery | AllSitesAuthorInfoByDiscordIdQuery;
    if (siteUrl) {
      response = await context.cromApi.request<
        SiteSpecificAuthorInfoByDiscordIdQuery,
        SiteSpecificAuthorInfoByDiscordIdQueryVariables
      >(SITE_SPECIFIC_AUTHOR_INFO_BY_DISCORD_ID_QUERY, {
        siteUrl: siteUrl,
        siteUrlString: siteUrl,
        discordId: discordUser.id,
      });
    } else {
      response = await context.cromApi.request<
        AllSitesAuthorInfoByDiscordIdQuery,
        AllSitesAuthorInfoByDiscordIdQueryVariables
      >(ALL_SITES_AUTHOR_INFO_BY_DISCORD_ID_QUERY, { discordId: discordUser.id });
    }

    user = response.discordUserInfo?.account?.wikidotIntegration?.wikidotUser;
    if (user) isLinked = true;

    // Discord name.
    if (!user) {
      const searchQuery = discordUser.username.toLowerCase();
      const matchingUser = await searchUser(context.cromApi, searchQuery, siteUrl);
      // Only use the response if it's an exact match.
      if (matchingUser?.displayName.toLowerCase() === searchQuery) {
        user = matchingUser;
      }
    }

    if (!user) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: [
            `*No author found named "${escapeMarkdown(discordUser.username)}".*`,
            // Custom no result message to suggest linking an account.
            !response.discordUserInfo?.account?.wikidotIntegration
              ? "*[Create a Crom account](https://crom.avn.sh/account) and link your wikidot account " +
                "to be able to call this command without needing to type in your wikidot username.*"
              : "",
          ].join("\n"),
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { embeds: [makeAuthorEmbed(context, user, siteUrl, isLinked)] },
    };
  },
});
