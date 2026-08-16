import * as assert from "node:assert/strict";

import { type APIEmbed } from "discord-api-types/v10";

import { ACTIVE_CONTEST_TAGS, PATREON_MESSAGE } from "../../constants";
import { gql } from "../../common/crom";
import {
  formatFullTitle,
  httpsify,
  formatRating,
  shouldShowPatreonMessage,
  embedColor,
  createImageCdnUrl,
  truncateText,
} from "../../util/formatting";
import { ATTRIBUTION_EMBED_INFO, formatAttributions } from "../../util/attribution-list";
import { isAdultTag, isArtworkTag } from "../../util/tags";
import type { PageEmbedInfoFragment } from "../../__generated__/graphql";
import type { Context } from "../../common/context";

export const PAGE_EMBED_INFO_FRAGMENT = gql`
  ${ATTRIBUTION_EMBED_INFO}
  fragment PageEmbedInfo on ResolvedPage {
    __typename
    url
    attributions {
      ...AttributionEmbedInfo
    }
    ... on WikidotPage {
      title
      rating
      voteCount
      tags
      createdAt
      thumbnailUrl
      summary
    }
    alternateTitles {
      title
    }
  }
`;

const OBJECT_CLASSES = {
  apollyon: "Apollyon",
  archon: "Archon",
  euclid: "Euclid",
  explained: "Explained",
  keter: "Keter",
  neutralized: "Neutralized",
  safe: "Safe",
  thaumiel: "Thaumiel",
  ticonderoga: "Ticonderoga",
};

const SURVIVAL_DIFFICULTIES = {
  "sd-class-?": "Undetermined",
  "sd-class-0": "Class 0",
  "sd-class-1": "Class 1",
  "sd-class-2": "Class 2",
  "sd-class-3": "Class 3",
  "sd-class-4": "Class 4",
  "sd-class-5": "Class 5",
  "sd-class-habitable": "Habitable",
  "sd-class-pending": "Pending",
  "sd-class-other": "Other",

  // Vietnamese
  "đk-cấp-?": "Undetermined",
  "đk-cấp-0": "Class 0",
  "đk-cấp-1": "Class 1",
  "đk-cấp-2": "Class 2",
  "đk-cấp-3": "Class 3",
  "đk-cấp-4": "Class 4",
  "đk-cấp-5": "Class 5",
  "đk-cấp-habitable": "Habitable",
  "đk-cấp-pending": "Pending",
  "đk-cấp-khác": "Other",

  // Russian
  "сложность-выживания-?": "Undetermined",
  "сложность-выживания-0": "Class 0",
  "сложность-выживания-1": "Class 1",
  "сложность-выживания-2": "Class 2",
  "сложность-выживания-3": "Class 3",
  "сложность-выживания-4": "Class 4",
  "сложность-выживания-5": "Class 5",

  // French
  "classe-?": "Undetermined",
  "classe-0": "Class 0",
  "classe-1": "Class 1",
  "classe-2": "Class 2",
  "classe-3": "Class 3",
  "classe-4": "Class 4",
  "classe-5": "Class 5",
  "classe-habitable": "Habitable",
  "classe-en-attente": "Pending",
  "classe-autre": "Other",

  // Chinese
  "生存难度?": "Undetermined",
  生存难度0: "Class 0",
  生存难度1: "Class 1",
  生存难度2: "Class 2",
  生存难度3: "Class 3",
  生存难度4: "Class 4",
  生存难度5: "Class 5",
  生存难度待定: "Pending",
  生存难度其他: "Other",

  // Portuguese
  "ds-classe-desconhecido": "Undetermined",
  "ds-classe-0": "Class 0",
  "ds-classe-1": "Class 1",
  "ds-classe-2": "Class 2",
  "ds-classe-3": "Class 3",
  "ds-classe-4": "Class 4",
  "ds-classe-5": "Class 5",
  "ds-classe-habitável": "Habitable",
  "ds-classe-pendente": "Pending",
  "ds-classe-outro": "Other",

  // Spanish
  "d-clase-?": "Undetermined",
  "d-clase-0": "Class 0",
  "d-clase-1": "Class 1",
  "d-clase-2": "Class 2",
  "d-clase-3": "Class 3",
  "d-clase-4": "Class 4",
  "d-clase-5": "Class 5",
  "d-clase-pendiente": "Pending",
  "d-clase-otra": "Other",
};

const ATTRIBUTION_CONTAINS_TRANSLATORS = [
  "http://scp-wiki.wikidot.com",
  "http://scp-pt-br.wikidot.com",
];

const ONE_WEEK_MS = 7 * 24 * 3_600_000;

/**
 * Take a PageEmbedInfoFragment and turn it into a response.
 */
export function makePageEmbed(
  _context: Context,
  page: PageEmbedInfoFragment,
  siteUrl: string,
  footerText?: string,
  expanded?: boolean,
): APIEmbed {
  // For now, the discord bot only supports wikidot sites.
  assert.equal(page.__typename, "WikidotPage", "Unexpected non-Wikidot page");

  const isAdult = page.tags.some(isAdultTag);
  const isArtwork = page.tags.some(isArtworkTag);

  const title = formatFullTitle(page.title, page.alternateTitles[0]?.title);
  let description = "";

  if (page.summary) {
    description += `*${truncateText(page.summary, 180)}*\n⸺\n`;
  }

  // Generate attribution lines ("by ...")
  if (page.attributions.length > 0) {
    // Split into logical groups (currently "written by" and "translated by" where applicable).
    // We might have "rewritten by" in the future if the ordering can be generally trusted.
    const hasTranslatorsInAttributions = ATTRIBUTION_CONTAINS_TRANSLATORS.includes(siteUrl);
    const attributionGroups = hasTranslatorsInAttributions
      ? {
          written: page.attributions.filter((attr) => attr.type !== "TRANSLATOR"),
          translated: page.attributions.filter((attr) => attr.type === "TRANSLATOR"),
        }
      : {
          written: page.attributions,
          translated: [],
        };

    for (const groupedAttributionType of ["written", "translated"] as const) {
      const attributions = attributionGroups[groupedAttributionType];
      if (attributions.length === 0) continue;

      const markdownAttributions = formatAttributions({ attributions, siteUrl: siteUrl, expanded });

      if (groupedAttributionType === "written") {
        if (attributionGroups.translated.length === 0) {
          description += `**by** *${markdownAttributions}*\n`;
        } else {
          description += `**Written by:** *${markdownAttributions}*\n`;
        }
      } else if (groupedAttributionType === "translated") {
        description += `**Translated by:** *${markdownAttributions}*\n`;
      }
    }
  }

  // Find object class(es) ("Object class: Thaumiel" or "Object classes: Euclid, Keter")
  const objectClasses = page.tags.filter(
    ((t) => t in OBJECT_CLASSES) as (t: string) => t is keyof typeof OBJECT_CLASSES,
  );
  if (objectClasses && objectClasses.length > 0) {
    description +=
      `**Object Class${objectClasses.length > 1 ? "es" : ""}**: ` +
      objectClasses.map((c) => OBJECT_CLASSES[c]).join(", ") +
      `\n`;
  }

  // Find survival difficulty ("Survival difficulty: Class 4")
  const survivalDifficulty = page.tags.find(
    (t: string) => t in SURVIVAL_DIFFICULTIES,
  ) as keyof typeof SURVIVAL_DIFFICULTIES;
  if (survivalDifficulty) {
    description += `**Survival difficulty**: ${SURVIVAL_DIFFICULTIES[survivalDifficulty]}\n`;
  }

  // Generate rating ("Rating: +10")
  if (
    typeof page.rating === "number" &&
    // Hide the ratings for active contests
    !ACTIVE_CONTEST_TAGS.some((contest) => page.tags.includes(contest.tag))
  ) {
    const rating = page.rating;
    const voteCount = page.voteCount;

    description += `**Rating**: ${formatRating(rating)}`;

    // If new article are controversial, add a "% upvoted" indicator as well.
    // Maybe a wilson score would be a better metric than percentages?
    if (voteCount && voteCount > 5) {
      const upvotePercentage = (voteCount + rating) / (2 * voteCount);
      if (
        // If the page is new and "controversial" (i.e. not disliked, but not loved either)
        (Date.now() < Date.parse(page.createdAt) + ONE_WEEK_MS &&
          upvotePercentage > 0.25 &&
          upvotePercentage < 0.75) ||
        // Or if the page is older and not "liked" (i.e. less than 60% upvoted)
        // But don't bother showing this for negatively rated articles.
        (Date.now() >= Date.parse(page.createdAt) + ONE_WEEK_MS &&
          rating > 0 &&
          upvotePercentage < 0.6)
      ) {
        const percentUpvoted = Math.round(upvotePercentage * 100);
        description += ` / ${percentUpvoted}% upvoted`;
      }
    }

    description += "\n";
  }

  // Add a thumbnail if one is present (and blur the thumbnail for adult pages)
  let thumbnailUrl: string | undefined;
  if (page.thumbnailUrl && URL.canParse(page.thumbnailUrl)) {
    const transformations =
      "h=200&w=200&fit=cover&a=attention&output=jpg" + (isAdult ? "&blur=100" : "");
    thumbnailUrl = createImageCdnUrl(page.thumbnailUrl, transformations);
  }

  const footerParts: string[] = [];

  // Add "fresh" for articles newer than a week
  if (Date.now() < Date.parse(page.createdAt) + ONE_WEEK_MS) {
    footerParts.push("🎀 fresh");
  }

  // Add "adult" for articles with an adult tag
  if (isAdult) {
    footerParts.push("🔞 adult");
  }

  // Add "artwork" for articles with an artwork tag
  if (isArtwork) {
    footerParts.push("🖼️ artwork");
  }

  // Plug patreon if no other parts are present.
  if (footerParts.length === 0 && shouldShowPatreonMessage()) {
    footerParts.push(PATREON_MESSAGE);
  }

  return {
    title: title.length > 256 ? title.slice(0, 255) + "…" : title,
    description,
    url: httpsify(page.url),
    color: embedColor(siteUrl),
    thumbnail: thumbnailUrl ? { url: thumbnailUrl, width: 200, height: 200 } : undefined,
    footer:
      footerParts.length > 0
        ? { text: [footerText, footerParts.join(" ")].filter(Boolean).join(" / ") }
        : footerText
          ? { text: footerText }
          : undefined,
  };
}
