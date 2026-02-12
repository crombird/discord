import * as assert from "node:assert/strict";

import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponseCallbackData,
  type APIMessageComponentInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./fullsearch.intl";
import { autocompleteSites } from "../util/discord-autocomplete";
import { findOption } from "../util/discord-interaction";
import { ACTIVE_CONTEST_TAGS, PATREON_MESSAGE } from "../constants";
import { userDependentResponse } from "../util/discord-response";
import {
  embedColor,
  escapeMarkdown,
  formatFullTitle,
  formatRating,
  httpsify,
  shouldShowPatreonMessage,
} from "../util/formatting";
import SITES from "../__generated__/sites";

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "fullsearch",
    name_localizations: localizationMap(messages.commandName),
    description: "Search for an article by its contents in the current wiki",
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
        description: "The query terms to search by",
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
        interaction.data.name === "fullsearch") ||
      (interaction.type === InteractionType.MessageComponent &&
        interaction.data.custom_id.startsWith("fullsearch-"))
    );
  },

  async handle(interaction, context) {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return autocompleteSites(interaction);
    }

    let query: string;
    let site: (typeof SITES)[number];
    // This is either random (for slash commands) or encoded in the message
    // component, so that the footer is stable during pagination.
    let showPatreon = shouldShowPatreonMessage();
    let page = 1;

    if (interaction.type === InteractionType.ApplicationCommand) {
      query = findOption(
        // query is required, so the options array will always exist.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        interaction.data.options!,
        "query",
        ApplicationCommandOptionType.String,
        true,
      );
      const shortName = findOption(
        interaction.data.options,
        "wiki",
        ApplicationCommandOptionType.String,
      );
      if (shortName) {
        const shortNameSite = SITES.find((site) => site.shortName === shortName);
        if (!shortNameSite) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `*Select a valid wiki from the suggestions.*`,
              flags: MessageFlags.Ephemeral,
            },
          };
        }
        site = shortNameSite;
      } else {
        site = context.defaultSite;
      }
    } else {
      let siteIndex;
      // We created this custom ID, so we're just trusting everything checks out.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [query, siteIndex, showPatreon, page] = JSON.parse(
        interaction.data.custom_id.replace(/^fullsearch-/, ""),
      );
      const matchedSite = SITES[siteIndex as number];
      assert.ok(matchedSite);
      site = matchedSite;
    }

    const typesense = await context.typesenseApi.request({
      query,
      page,
      siteUrl: site.url,
      includeTextContent: true,
      highlightFields: true,
    });

    if (typesense.hits.length === 0) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `*No results for "${query}".*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    const pageCount = Math.ceil(typesense.found / 5);
    const hasNextPage = typesense.found > page * 5;
    const formattedResults = typesense.hits.map(({ document, highlights: [highlight] }) => {
      const hideRating = document.tags.some((tag) =>
        ACTIVE_CONTEST_TAGS.some((contest) => contest.tag === tag),
      );
      const rating = formatRating(document.rating);
      const url = httpsify(document.url);
      const title = document.title ?? "";
      const alternateTitle = document.alternateTitle;
      const textSnippet = highlight?.field.startsWith("textContent")
        ? escapeMarkdown(highlight.snippet.replace(/\s+/g, " ")).replace(/<bold>/g, "**")
        : null;
      return (
        `• **[${formatFullTitle(title, alternateTitle)}](${url})**` +
        (hideRating ? "" : ` (${rating})`) +
        (textSnippet ? `\n> _...${textSnippet}..._` : "")
      );
    });

    // Discord clamps description at 4096 chars.
    const responseMatches: string[] = [];
    let totalLength = 0;
    for (const text of formattedResults) {
      // `+ formattedResults.length` to include newlines
      if (totalLength + text.length + formattedResults.length > 4096) break;
      responseMatches.push(text);
      totalLength += text.length;
    }

    // Custom ID parameters (custom ids are limited to 100 chars)
    const q = query.slice(0, 80);
    const w = SITES.indexOf(site);
    const p = showPatreon ? 1 : 0;

    const data: APIInteractionResponseCallbackData = {
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: `Results for "${q}"`,
          description: responseMatches.join("\n"),
          color: embedColor(site.url),
          footer: {
            text:
              `Page ${page ?? 1} of ${pageCount}` + (showPatreon ? " / " + PATREON_MESSAGE : ""),
          },
        },
      ],
    };

    if (hasNextPage || interaction.type === InteractionType.MessageComponent) {
      data.components = [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              // Adding an arbitrary number at the end so that this always has a unique ID.
              custom_id: "fullsearch-" + JSON.stringify([q, w, p, 1, 1]),
              disabled: !page || page === 1,
              emoji: { name: "⏮️" },
              label: "First",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id: "fullsearch-" + JSON.stringify([q, w, p, page - 1]),
              disabled: !page || page === 1,
              emoji: { name: "◀️" },
              label: "Previous",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              custom_id: "fullsearch-" + JSON.stringify([q, w, p, page + 1]),
              disabled: !hasNextPage,
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
