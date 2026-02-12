import {
  type APIMessageApplicationCommandInteraction,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";

import { defineCommand } from "../common/command";
import { gql } from "../common/crom";
import { localizationMap } from "../util/locale";
import * as messages from "./add-to-reading-list.intl";
import type {
  GetCurrentDefaultReadingListItemsQuery,
  GetCurrentDefaultReadingListItemsQueryVariables,
  UpdateCurrentDefaultReadingListItemsMutation,
  UpdateCurrentDefaultReadingListItemsMutationVariables,
} from "../__generated__/graphql";
import { getInteractionUser } from "../util/discord-interaction";

const GET_CURRENT_DEFAULT_READING_LIST_ITEMS_QUERY = gql`
  query GetCurrentDefaultReadingListItems($discordId: String!) {
    discordUserInfo(discordId: $discordId) {
      account {
        defaultReadingList {
          id
          slug
          items {
            comment
            insertedAt
            page {
              url
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CURRENT_DEFAULT_READING_LIST_ITEMS_MUTATION = gql`
  mutation UpdateCurrentDefaultReadingListItems($input: UpdateReadingListInput!) {
    updateReadingList(input: $input) {
      readingList {
        id
      }
    }
  }
`;

export default defineCommand({
  definition: {
    type: ApplicationCommandType.Message,
    name: "Add to reading list",
    name_localizations: localizationMap(messages.commandName),
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

  select(interaction): interaction is APIMessageApplicationCommandInteraction {
    return (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.type === ApplicationCommandType.Message &&
      interaction.data.name === "Add to reading list"
    );
  },

  async handle(interaction, context) {
    const targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
    if (
      !targetMessage?.embeds[0]?.url ||
      targetMessage.author.username !== "Crom" ||
      targetMessage.author.discriminator !== "5028"
    ) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content: "*This message is not a Crom search response.*",
        },
      };
    }

    // TODO: Verify that the URL points to a valid page?
    // TODO: This will also trigger for /latest embed titles?

    const user = getInteractionUser(interaction);
    const { discordUserInfo } = await context.cromApi.request<
      GetCurrentDefaultReadingListItemsQuery,
      GetCurrentDefaultReadingListItemsQueryVariables
    >(GET_CURRENT_DEFAULT_READING_LIST_ITEMS_QUERY, { discordId: user.id });

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

    const pageUrl = targetMessage.embeds[0].url.replace(/^https:/, "http:");
    if (
      discordUserInfo.account.defaultReadingList.items.some((item) => item.page.url === pageUrl)
    ) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content: "*This page is already in your reading list.*",
        },
      };
    }

    await context.cromApi.request<
      UpdateCurrentDefaultReadingListItemsMutation,
      UpdateCurrentDefaultReadingListItemsMutationVariables
    >(UPDATE_CURRENT_DEFAULT_READING_LIST_ITEMS_MUTATION, {
      input: {
        id: discordUserInfo.account.defaultReadingList.id,
        items: [
          ...discordUserInfo.account.defaultReadingList.items.map((item) => ({
            pageUrl: item.page.url,
            insertedAt: item.insertedAt,
            comment: item.comment,
          })),
          { pageUrl, insertedAt: new Date().toISOString() },
        ],
      },
    });

    const listUrl = `https://crom.avn.sh/lists/${discordUserInfo.account.defaultReadingList.slug}`;
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        flags: MessageFlags.Ephemeral,
        content: `*Added to your **[default reading list](<https://crom.avn.sh/login?return_to=${encodeURIComponent(listUrl)}>)**.*`,
      },
    };
  },
});
