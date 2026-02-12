import {
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmission,
  ComponentType,
  TextInputStyle,
} from "discord-api-types/v10";

import type {
  DiscordGuildManagedRoleConfigInput,
  ManagedRoleConfigFragment,
} from "../../../__generated__/graphql";
import SITES from "../../../__generated__/sites";
import { CUSTOM_IDS } from "../custom-ids";

type DiscordGuildManagedRolePageConfig = Extract<
  ManagedRoleConfigFragment["config"],
  { __typename: "DiscordGuildManagedRolePageConfig" }
>;

export interface ConfigureAuthorshipResponseParams {
  roleId: string;
  roleConfig: DiscordGuildManagedRolePageConfig;
}

export function configureAuthorshipModalResponse({
  roleId,
  roleConfig,
}: ConfigureAuthorshipResponseParams): APIModalInteractionResponseCallbackData {
  return {
    title: "Edit authorship based checks",
    custom_id: `${CUSTOM_IDS.MODAL_CONFIGURE_AUTHORSHIP}-${roleId}`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Applicable wiki URLs (HTTP, one per line)",
            custom_id: "site-urls",
            style: TextInputStyle.Paragraph,
            required: true,
            value: roleConfig.siteUrls.join("\n"),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Minimum pages authored by user",
            custom_id: "min-page-count",
            style: TextInputStyle.Short,
            value: roleConfig.minPageCount.toString(),
            required: true,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Minimum page rating",
            custom_id: "min-page-rating",
            style: TextInputStyle.Short,
            required: false,
            value:
              typeof roleConfig.minRating === "number"
                ? roleConfig.minRating.toString()
                : undefined,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Minimum page age (in hours)",
            custom_id: "min-page-age",
            style: TextInputStyle.Short,
            required: false,
            value:
              typeof roleConfig.minAgeHours === "number"
                ? roleConfig.minAgeHours.toString()
                : undefined,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Filter by tags (join with commas)",
            custom_id: "tags",
            style: TextInputStyle.Paragraph,
            required: false,
            value: [...roleConfig.withTags, ...roleConfig.excludeTags.map((tag) => `-${tag}`)].join(
              ",",
            ),
          },
        ],
      },
    ],
  };
}

export function parseAuthorshipModalInteraction(
  modal: APIModalSubmission,
): DiscordGuildManagedRoleConfigInput {
  const textInputs = modal.components.flatMap((actionRow) =>
    actionRow.type === ComponentType.ActionRow ? actionRow.components : [],
  );

  // TODO: Perhaps a findModalInputValue helper function?

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const rawMinPageCount = textInputs.find((c) => c.custom_id === "min-page-count")!.value;
  const rawSiteUrls = textInputs.find((c) => c.custom_id === "site-urls")!.value;
  const rawTags = textInputs.find((c) => c.custom_id === "tags")!.value;
  const rawMinPageAge = textInputs.find((c) => c.custom_id === "min-page-age")!.value;
  const rawMinPageRating = textInputs.find((c) => c.custom_id === "min-page-rating")!.value;
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  const minPageCount = /^[0-9]+$/.test(rawMinPageCount) ? parseInt(rawMinPageCount) : 1;
  const siteUrls = rawSiteUrls
    .split("\n")
    .map((str) => str.replace(/^https:\/\//, "http://"))
    .filter((siteUrl) => SITES.some((site) => site.url === siteUrl));
  const withTags = rawTags.split(/[\s,]+/).filter((tag) => tag && !tag.startsWith("-"));
  const excludeTags = rawTags
    .split(/[\s,]+/)
    .filter((tag) => !!tag && tag.startsWith("-"))
    .map((tag) => tag.slice(1));
  const minAgeHours = /^[0-9]+$/.test(rawMinPageAge) ? parseInt(rawMinPageAge) : undefined;
  const minRating = /^[+-]?[0-9]+$/.test(rawMinPageRating) ? parseInt(rawMinPageRating) : undefined;

  return {
    discordGuildManagedRolePageConfig: {
      minPageCount,
      siteUrls,
      withTags,
      excludeTags,
      minAgeHours,
      minRating,
    },
  };
}
