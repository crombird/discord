import * as assert from "node:assert/strict";

import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteractionDataSubcommandOption,
  type APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./settings.intl";
import { gql } from "../common/crom";
import { autocompleteFromList, autocompleteSites } from "../util/discord-autocomplete";
import { findOption, getInteractionUser } from "../util/discord-interaction";
import { type Context } from "../common/context";
import type {
  UpdateDiscordUserInfoMutation,
  UpdateDiscordUserInfoMutationVariables,
  UpdateDiscordGuildInfoMutation,
  UpdateDiscordGuildInfoMutationVariables,
} from "../__generated__/graphql";
import SITES from "../__generated__/sites";

const UPDATE_DISCORD_GUILD_INFO = gql`
  mutation updateDiscordGuildInfo($input: UpdateDiscordGuildInfoInput!) {
    updateDiscordGuildInfo(input: $input) {
      discordGuildInfo {
        defaultSiteUrl
      }
    }
  }
`;

const UPDATE_DISCORD_USER_INFO = gql`
  mutation updateDiscordUserInfo($input: UpdateDiscordUserInfoInput!) {
    updateDiscordUserInfo(input: $input) {
      discordUserInfo {
        defaultSiteUrl
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "settings",
    name_localizations: localizationMap(messages.commandName),
    description: `Update settings for Crom`,
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
        type: ApplicationCommandOptionType.Subcommand,
        name: "wiki",
        name_localizations: localizationMap(messages.optionWikiName),
        description: "The wiki that Crom searches if you don't specify one",
        description_localizations: localizationMap(messages.optionWikiDescription),
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: "name",
            name_localizations: localizationMap(messages.optionWikiNameName),
            description: "The wiki to use for your account",
            description_localizations: localizationMap(messages.optionWikiNameDescription),
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "server-wiki",
        name_localizations: localizationMap(messages.optionServerWikiName),
        description: "The wiki to search by default for all users of this server",
        description_localizations: localizationMap(messages.optionServerWikiDescription),
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: "name",
            name_localizations: localizationMap(messages.optionServerWikiNameName),
            description: "The wiki to set this server to",
            description_localizations: localizationMap(messages.optionServerWikiNameDescription),
            required: true,
            autocomplete: true,
          },
        ],
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
      interaction.data.name === "settings"
    );
  },

  async handle(interaction, context) {
    const options = interaction.data.options;
    assert.ok(options, "Options should always be provided for subcommands");

    const subcommand = options[0] as APIApplicationCommandInteractionDataSubcommandOption;

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      if (subcommand.name === "wiki") {
        return autocompleteFromList(interaction, [
          { name: "None (use server default)", value: "none" },
          ...SITES.map((site) => ({ name: site.displayName, value: site.shortName })),
        ]);
      } else {
        return autocompleteSites(interaction);
      }
    }

    if (subcommand.name === "wiki") {
      assert.ok(subcommand.options, "name is a required option, should always be provided");

      const shortName = findOption(
        subcommand.options,
        "name",
        ApplicationCommandOptionType.String,
        true,
      );

      if (shortName === "none") {
        await updateDiscordUser(getInteractionUser(interaction).id, context, {
          defaultSiteUrl: null,
        });
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `Crom commands will now use the server's default wiki.`,
            flags: MessageFlags.Ephemeral,
          },
        };
      }

      const matchedSite = SITES.find((site) => site.shortName === shortName);
      if (!matchedSite) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `*Please select a valid wiki from the suggestions.*`,
            flags: MessageFlags.Ephemeral,
          },
        };
      }

      await updateDiscordUser(getInteractionUser(interaction).id, context, {
        defaultSiteUrl: matchedSite.url,
      });
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `Updated your default wiki to **${matchedSite.displayName}**.`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    if (subcommand.name === "server-wiki") {
      if (!interaction.guild_id) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: { content: `You can't edit server settings in DMs.` },
        };
      }

      assert.ok(interaction.member, "This command can only be used in a guild");
      if (
        (BigInt(interaction.member.permissions) & PermissionFlagsBits.ManageGuild) !==
        PermissionFlagsBits.ManageGuild
      ) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: { content: `You need the "Manage Server" permission to update this setting.` },
        };
      }

      assert.ok(subcommand.options, "name is a required option, should always be provided");
      const shortName = findOption(
        subcommand.options,
        "name",
        ApplicationCommandOptionType.String,
        true,
      );

      const matchedSite = SITES.find((site) => site.shortName === shortName);
      if (!matchedSite) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `*Please select a valid wiki from the suggestions.*`,
            flags: MessageFlags.Ephemeral,
          },
        };
      }

      await updateGuildConfig(interaction.guild_id, context, { defaultSiteUrl: matchedSite.url });
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `Updated the server's default wiki to **${matchedSite.displayName}**.` },
      };
    }

    throw new Error("Unknown subcommand");
  },
});

async function updateGuildConfig(
  guildId: string,
  context: Context,
  newContext: { defaultSiteUrl?: string | null },
) {
  await context.cromApi.request<
    UpdateDiscordGuildInfoMutation,
    UpdateDiscordGuildInfoMutationVariables
  >(UPDATE_DISCORD_GUILD_INFO, { input: { guildId, defaultSiteUrl: newContext.defaultSiteUrl } });
  context.clearCacheByGuild(guildId);
}

async function updateDiscordUser(
  discordId: string,
  context: Context,
  newContext: { defaultSiteUrl?: string | null },
) {
  await context.cromApi.request<
    UpdateDiscordUserInfoMutation,
    UpdateDiscordUserInfoMutationVariables
  >(UPDATE_DISCORD_USER_INFO, { input: { discordId, defaultSiteUrl: newContext.defaultSiteUrl } });
  context.clearCacheByUser(discordId);
}
