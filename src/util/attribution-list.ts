import { gql } from "../common/crom";
import { escapeMarkdown, httpsify } from "./formatting";
import { PATREON_SUPPORTER_EMOJI } from "../constants";
import type { AttributionEmbedInfoFragment } from "../__generated__/graphql";

const DEFAULT_MAX_ATTRIBUTION_COUNT = 15;
const MAX_ATTRIBUTION_CHARACTER_COUNT = 3500;
const ATTRIBUTION_ORDER = ["TRANSLATOR", "REWRITE", "SUBMITTER", "AUTHOR"];

export const ATTRIBUTION_EMBED_INFO = gql`
  fragment AttributionEmbedInfo on PageAttribution {
    type
    date
    order
    user {
      __typename
      displayName
      ... on UserWikidotNameReference {
        wikidotUser {
          userPage(siteUrl: $siteUrl) {
            url
          }
          linkedAccount {
            patreonIntegration {
              isActive
            }
          }
        }
      }
    }
  }
`;

export interface FormatAttributionsParams {
  attributions: AttributionEmbedInfoFragment[];
  siteUrl: string;
  italicised?: boolean;
  expanded?: boolean;
}

export function formatAttributions({
  attributions,
  siteUrl,
  italicised = false,
  expanded = false,
}: FormatAttributionsParams): string {
  const sorted = uniqueBy(
    attributions.toSorted(
      (a, b) =>
        // More important attribution type first
        ATTRIBUTION_ORDER.indexOf(a.type) - ATTRIBUTION_ORDER.indexOf(b.type) ||
        // More recent attributions first, but attributions without a date go last.
        (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0) ||
        // After all other rules, follow the order in the attribution metadata page.
        a.order - b.order ||
        // Put users with an author page first.
        (a.user.__typename === "UserWikidotNameReference" && a.user.wikidotUser?.userPage ? 0 : 1) -
          (b.user.__typename === "UserWikidotNameReference" && b.user.wikidotUser?.userPage
            ? 0
            : 1),
    ),
    (attr) => attr.user.displayName,
  );

  const shouldTruncate = !expanded && sorted.length > DEFAULT_MAX_ATTRIBUTION_COUNT;

  // There are two cases where we truncate. Either by default (which can be
  // overridden by `expanded`) or when we literally can't fit the attributions
  // in the embed anymore. We check the final markdown each time and adjust if
  // necessary.
  let truncated = shouldTruncate ? shuffle(sorted).slice(0, DEFAULT_MAX_ATTRIBUTION_COUNT) : sorted;
  let truncatedCount = shouldTruncate ? sorted.length - DEFAULT_MAX_ATTRIBUTION_COUNT : 0;
  let markdown = "";
  while (true) {
    markdown = truncated
      .map((attr) => {
        const escapedName = escapeMarkdown(attr.user.displayName);
        const authorPageUrl =
          attr.user.__typename === "UserWikidotNameReference" &&
          attr.user.wikidotUser?.userPage?.url.startsWith(siteUrl)
            ? attr.user.wikidotUser.userPage.url
            : null;

        return (
          (italicised ? "***" : "") +
          (authorPageUrl ? `[${escapedName}](${httpsify(authorPageUrl)})` : escapedName) +
          (attr.user.__typename === "UserWikidotNameReference" &&
          attr.user.wikidotUser?.linkedAccount?.patreonIntegration?.isActive
            ? PATREON_SUPPORTER_EMOJI
            : "") +
          (italicised ? "***" : "")
        );
      })
      .join(", ");

    if (markdown.length > MAX_ATTRIBUTION_CHARACTER_COUNT) {
      if (truncatedCount === 0) {
        truncated = shuffle(truncated);
      }
      truncated.pop();
      truncatedCount++;
    } else {
      break;
    }
  }

  if (truncatedCount > 0) return `${markdown}, and ${truncatedCount} more`;
  return markdown;
}

/**
 * Take an array and remove any duplicates based on the selector function,
 * keeping only the first occurrence of each unique value.
 */
function uniqueBy<T, U>(array: T[], selector: (value: T) => U): T[] {
  const seenItems = new Set<U>();
  const uniqueItems: T[] = [];
  for (const item of array) {
    const value = selector(item);
    if (!seenItems.has(value)) {
      seenItems.add(value);
      uniqueItems.push(item);
    }
  }
  return uniqueItems;
}

/** Shuffle an array and return the shuffled copy. */
function shuffle<T>(array: T[]): T[] {
  return array
    .map((value) => [value, Math.random()] as const)
    .sort(([, keyA], [, keyB]) => keyA - keyB)
    .map(([value]) => value);
}
