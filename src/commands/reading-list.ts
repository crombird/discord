import {
  type APIChatInputApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  type APIInteractionResponseCallbackData,
  ApplicationCommandType,
  InteractionType,
  ApplicationIntegrationType,
  InteractionContextType,
  InteractionResponseType,
  MessageFlags,
  ComponentType,
  ButtonStyle,
} from "discord-api-types/v10";
import { formatDistanceToNow } from "date-fns";

import { defineCommand } from "../common/command";
import { localizationMap } from "../util/locale";
import * as messages from "./reading-list.intl";
import { gql } from "../common/crom";
import { escapeMarkdown, formatFullTitle, httpsify, truncateText } from "../util/formatting";
import { userDependentResponse } from "../util/discord-response";
import { DEFAULT_EMBED_COLOR } from "../constants";
import { getInteractionUser } from "../util/discord-interaction";
import type {
  GetDefaultReadingListQuery,
  GetDefaultReadingListQueryVariables,
} from "../__generated__/graphql";

const GET_DEFAULT_READING_LIST_QUERY = gql`
  query GetDefaultReadingList($discordId: String!) {
    discordUserInfo(discordId: $discordId) {
      account {
        defaultReadingList {
          slug
          title
          updatedAt
          privacy
          items {
            comment
            page {
              url
              page {
                __typename
                ... on WikidotPage {
                  title
                  rating
                }
                alternateTitles {
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.ChatInput,
    name: "reading-list",
    name_localizations: localizationMap(messages.commandName),
    description: "View or share your default Crom account reading list",
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

  select(
    interaction,
  ): interaction is APIChatInputApplicationCommandInteraction | APIMessageComponentInteraction {
    return (
      (interaction.type === InteractionType.ApplicationCommand &&
        interaction.data.type === ApplicationCommandType.ChatInput &&
        interaction.data.name === "reading-list") ||
      (interaction.type === InteractionType.MessageComponent &&
        interaction.data.custom_id.startsWith("reading-list-"))
    );
  },

  async handle(interaction, context) {
    // TODO: Reset page when item count changes?

    let page = 1;
    if (interaction.type === InteractionType.MessageComponent) {
      const pageStr = interaction.data.custom_id.replace(/^reading-list-p-/, "");
      if (pageStr === "refresh" || pageStr === "first") {
        page = 1;
      } else {
        page = parseInt(pageStr);
      }
    }

    const user = getInteractionUser(interaction);
    const { discordUserInfo } = await context.cromApi.request<
      GetDefaultReadingListQuery,
      GetDefaultReadingListQueryVariables
    >(GET_DEFAULT_READING_LIST_QUERY, { discordId: user.id });

    if (!discordUserInfo.account) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content:
            `*It looks like you don't have a Crom account linked to your Discord account. ` +
            `You can get started by [creating a new account or linking your existing account](https://crom.avn.sh/account).*`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    const readingList = discordUserInfo.account.defaultReadingList;

    if (!readingList) {
      throw new Error("No default reading list found for user: " + user.id);
    }

    let description = ``;
    description += readingList.items
      .slice((page - 1) * 10, page * 10)
      .map((item, i) => {
        let itemText = `${(page - 1) * 10 + i + 1}. `;
        if (item.page.page?.__typename === "WikidotPage") {
          const title = item.page.page.title;
          const alternateTitle = item.page.page.alternateTitles[0]?.title;
          itemText += `**[${formatFullTitle(escapeMarkdown(title), alternateTitle && escapeMarkdown(alternateTitle))}](${httpsify(item.page.url)})**`;
        } else {
          itemText = `**${item.page.url}** (*page may no longer exist*)`;
        }
        if (item.comment) {
          itemText += ` \n  > *${truncateText(item.comment, 300)}*`;
        }
        return itemText;
      })
      .join("\n");

    let listUrl = `https://crom.avn.sh/lists/${readingList.slug}`;
    if (readingList.privacy === "PRIVATE") {
      listUrl = `https://crom.avn.sh/login?return_to=${encodeURIComponent(listUrl)}`;
    }

    const data: APIInteractionResponseCallbackData = {
      flags: readingList.privacy === "PRIVATE" ? MessageFlags.Ephemeral : undefined,
      embeds: [
        {
          title: readingList.title,
          url: listUrl,
          description,
          color: DEFAULT_EMBED_COLOR,
          footer: {
            text:
              "Updated " +
              formatDistanceToNow(readingList.updatedAt, {
                addSuffix: true,
                locale: context.dateFnsLocale,
              }) +
              "  •  " +
              `${readingList.items.length}` +
              " item" +
              (readingList.items.length === 1 ? "" : "s") +
              "  •  " +
              (readingList.privacy === "PUBLIC"
                ? "Public"
                : readingList.privacy === "UNLISTED"
                  ? "Unlisted"
                  : "Private"),
          },
        },
      ],
      components:
        readingList.items.length <= 10
          ? [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: "reading-list-p-refresh",
                    emoji: { name: "🔁" },
                    label: "Refresh",
                  },
                ],
              },
            ]
          : [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: "reading-list-p-refresh",
                    emoji: { name: "🔁" },
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: "reading-list-p-first",
                    disabled: page === 1,
                    emoji: { name: "⏮️" },
                    label: "First",
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: `reading-list-p-${Math.max(page - 1, 1)}`,
                    disabled: page === 1,
                    emoji: { name: "◀️" },
                    label: "Previous",
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: `reading-list-p-${page + 1}`,
                    disabled: readingList.items.length / 10 <= page,
                    emoji: { name: "▶️" },
                    label: "Next",
                  },
                ],
              },
            ],
    };

    return userDependentResponse(interaction, data);
  },
});
