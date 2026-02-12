import * as assert from "node:assert/strict";

import { type APIEmbed } from "discord-api-types/v10";
import { formatDistanceToNow } from "date-fns";

import { gql } from "../../common/crom";
import {
  formatFullTitle,
  formatRating,
  httpsify,
  shouldShowPatreonMessage,
  embedColor,
} from "../../util/formatting";
import { ACTIVE_CONTEST_TAGS, PATREON_MESSAGE, PATREON_SUPPORTER_EMOJI } from "../../constants";
import type {
  SearchUsersQuery,
  SearchUsersQueryVariables,
  BasicUserEmbedInfoFragment,
  SiteSpecificUserEmbedInfoFragment,
  AllSitesUserEmbedInfoFragment,
  SiteSpecificAuthorInfoByIdQuery,
  SiteSpecificAuthorInfoByIdQueryVariables,
  AllSitesAuthorInfoByIdQuery,
  AllSitesAuthorInfoByIdQueryVariables,
} from "../../__generated__/graphql";
import SITES from "../../__generated__/sites";
import type { CromClient } from "../../common/crom";
import type { Context } from "../../common/context";

export type UserEmbedInfoFragment = BasicUserEmbedInfoFragment &
  (AllSitesUserEmbedInfoFragment | SiteSpecificUserEmbedInfoFragment);

export const CHOICES = [
  { name: "All wikis", value: "all" },
  ...SITES.map(({ displayName: name, shortName: value }) => ({ name, value })),
];

export const BASIC_USER_EMBED_INFO_FRAGMENT = gql`
  fragment BasicUserEmbedInfo on User {
    __typename
    displayName
    ... on WikidotUser {
      wikidotId
      linkedAccount {
        patreonIntegration {
          isActive
        }
      }
    }
  }
`;

export const ALL_SITES_USER_EMBED_INFO_FRAGMENT = gql`
  fragment AllSitesUserEmbedInfo on User {
    statistics {
      rank
      totalRating
      meanRating
      pageCount
      pageCountScp
      pageCountTale
      pageCountGoiFormat
      pageCountArtwork
      pageCountLevel
      pageCountEntity
      pageCountObject
    }
    attributedPages(
      first: 1
      sort: { key: WIKIDOT_CREATED_AT, order: DESC }
      filter: { onWikidotPage: { isHidden: { eq: false } } }
    ) {
      edges {
        node {
          __typename
          url
          alternateTitles {
            title
          }
          attributions {
            date
          }
          ... on WikidotPage {
            title
            rating
            createdAt
            tags
          }
        }
      }
    }
  }
`;

export const SITE_SPECIFIC_USER_EMBED_INFO_FRAGMENT = gql`
  fragment SiteSpecificUserEmbedInfo on User {
    ... on WikidotUser {
      userPage(siteUrl: $siteUrl) {
        url
      }
    }
    ... on UserWikidotNameReference {
      userPage(siteUrl: $siteUrl) {
        url
      }
    }
    statistics(siteUrl: $siteUrl) {
      rank
      totalRating
      meanRating
      pageCount
      pageCountScp
      pageCountTale
      pageCountGoiFormat
      pageCountArtwork
      pageCountLevel
      pageCountEntity
      pageCountObject
    }
    attributedPages(
      first: 1
      sort: { key: WIKIDOT_CREATED_AT, order: DESC }
      filter: { url: { startsWith: $siteUrlString }, onWikidotPage: { isHidden: { eq: false } } }
    ) {
      edges {
        node {
          __typename
          url
          alternateTitles {
            title
          }
          attributions {
            date
          }
          ... on WikidotPage {
            title
            rating
            createdAt
            tags
          }
        }
      }
    }
  }
`;

const SITE_SPECIFIC_AUTHOR_INFO_BY_ID_QUERY = gql`
  ${BASIC_USER_EMBED_INFO_FRAGMENT}
  ${SITE_SPECIFIC_USER_EMBED_INFO_FRAGMENT}
  query SiteSpecificAuthorInfoById($id: ID!, $siteUrl: URL!, $siteUrlString: String!) {
    user(id: $id) {
      ...BasicUserEmbedInfo
      ...SiteSpecificUserEmbedInfo
    }
  }
`;

const ALL_SITES_AUTHOR_INFO_BY_ID_QUERY = gql`
  ${BASIC_USER_EMBED_INFO_FRAGMENT}
  ${ALL_SITES_USER_EMBED_INFO_FRAGMENT}
  query AllSitesAuthorInfoById($id: ID!) {
    user(id: $id) {
      ...BasicUserEmbedInfo
      ...AllSitesUserEmbedInfo
    }
  }
`;

const SEARCH_USERS_QUERY = gql`
  query SearchUsers($query: String!, $siteUrl: URL) {
    searchUsers_v1(query: $query, siteUrl: $siteUrl) {
      id
      wikidotUser {
        id
      }
    }
  }
`;

export function makeAuthorEmbed(
  context: Context,
  user: UserEmbedInfoFragment,
  siteUrl: string | null,
  isLinked: boolean,
): APIEmbed {
  let site: (typeof SITES)[number] | null = null;
  if (siteUrl) {
    const matchedSite = SITES.find((site) => site.url === siteUrl);
    if (!matchedSite) throw new Error(`Site not found: ${siteUrl}`);
    site = matchedSite;
  }

  const authorPageUrl = "userPage" in user ? user.userPage?.url : undefined;
  const latestArticle = user.attributedPages.edges[0]?.node;
  if (latestArticle) {
    assert.equal(latestArticle.__typename, "WikidotPage", "Unexpected non-Wikidot page");
  }
  const latestArticleDate =
    latestArticle?.attributions
      .filter((a): a is { date: string } => !!a.date)
      .map((a) => new Date(a.date))
      .sort((a, b) => b.getTime() - a.getTime())[0] ??
    (latestArticle?.createdAt ? new Date(latestArticle?.createdAt) : undefined);
  const hideLatestArticleRating =
    typeof latestArticle?.rating === "number" &&
    latestArticle.tags.some((tag) => ACTIVE_CONTEST_TAGS.some((contest) => contest.tag === tag));

  const pageTypes: { count: number; singular: string; plural: string }[] = [];

  if (site?.type === "BACKROOMS") {
    pageTypes.push({
      singular: "level",
      plural: "levels",
      count: user.statistics?.pageCountLevel ?? 0,
    });
    pageTypes.push({
      singular: "entity",
      plural: "entities",
      count: user.statistics?.pageCountEntity ?? 0,
    });
    pageTypes.push({
      singular: "object",
      plural: "objects",
      count: user.statistics?.pageCountObject ?? 0,
    });
    pageTypes.push({
      singular: "tale",
      plural: "tales",
      count: user.statistics?.pageCountTale ?? 0,
    });
    pageTypes.push({
      singular: "other",
      plural: "others",
      count:
        (user.statistics?.pageCount ?? 0) -
        ((user.statistics?.pageCountLevel ?? 0) +
          (user.statistics?.pageCountEntity ?? 0) +
          (user.statistics?.pageCountObject ?? 0) +
          (user.statistics?.pageCountTale ?? 0)),
    });
  }

  if (site?.type === "SCP_WIKI") {
    pageTypes.push({
      singular: "SCP",
      plural: "SCPs",
      count: user.statistics?.pageCountScp ?? 0,
    });
    pageTypes.push({
      singular: "tale",
      plural: "tales",
      count: user.statistics?.pageCountTale ?? 0,
    });
    pageTypes.push({
      singular: "GoI format",
      plural: "GoI formats",
      count: user.statistics?.pageCountGoiFormat ?? 0,
    });
    pageTypes.push({
      singular: "artwork",
      plural: "artworks",
      count: user.statistics?.pageCountArtwork ?? 0,
    });
    pageTypes.push({
      singular: "other",
      plural: "others",
      count:
        (user.statistics?.pageCount ?? 0) -
        ((user.statistics?.pageCountScp ?? 0) +
          (user.statistics?.pageCountTale ?? 0) +
          (user.statistics?.pageCountGoiFormat ?? 0) +
          (user.statistics?.pageCountArtwork ?? 0)),
    });
  }

  const embed: APIEmbed = {
    author: {
      name: user.displayName + (user.statistics?.rank ? ` (#${user.statistics.rank})` : ""),
      url: authorPageUrl ? httpsify(authorPageUrl) : undefined,
      icon_url:
        "wikidotId" in user
          ? `https://www.wikidot.com/avatar.php?userid=${user.wikidotId}&timestamp=${Date.now()}`
          : undefined,
    },
    color: embedColor(siteUrl),
    description: [
      `**${authorPageUrl ? `[${user.displayName}](${httpsify(authorPageUrl)})` : user.displayName}**`,
      user.__typename === "WikidotUser" && user.linkedAccount?.patreonIntegration?.isActive
        ? PATREON_SUPPORTER_EMOJI
        : "",
      ` has a total of **${user.statistics?.pageCount ?? 0}** page${user.statistics?.pageCount === 1 ? "" : "s"}`,
      context.defaultSite.url !== siteUrl ? ` on **${site?.displayName ?? "all wikis"}**` : "",
      pageTypes.some(({ count }) => count > 0)
        ? " (" +
          pageTypes
            .filter(({ count }) => count > 0)
            .map(({ singular, plural, count }) => `${count} ${count === 1 ? singular : plural}`)
            .join(", ") +
          ")"
        : "",
      ` with a total rating of **${formatRating(user.statistics?.totalRating ?? 0)}**`,
      ` and an average rating of **${formatRating(user.statistics?.meanRating ?? 0)}**.`,
      ...(latestArticle && latestArticleDate
        ? [
            ` Their latest page is **[`,
            formatFullTitle(latestArticle.title, latestArticle.alternateTitles[0]?.title),
            `](`,
            httpsify(latestArticle.url),
            `)** (`,
            hideLatestArticleRating ? "" : `${formatRating(latestArticle.rating ?? 0)}, `,
            `posted `,
            formatDistanceToNow(latestArticleDate, {
              includeSeconds: true,
              addSuffix: true,
              locale: context.dateFnsLocale,
            }),
            `).`,
          ]
        : []),
      ` *[More info →](https://crom.avn.sh/aviary/user?${new URLSearchParams({ on: "wikidot", name: user.displayName }).toString()})*`,
    ].join(""),
  };

  const footerParts: string[] = [];
  if (isLinked) footerParts.push("🔗 Linked");
  if (shouldShowPatreonMessage()) footerParts.push(PATREON_MESSAGE);
  if (footerParts.length > 0) embed.footer = { text: footerParts.join(" / ") };

  return embed;
}

/** Call searchUsers on the API and get UserEmbedInfo for the first result. */
export async function searchUser(
  cromApi: CromClient,
  query: string,
  siteUrl: string | null,
): Promise<UserEmbedInfoFragment | null> {
  const { searchUsers_v1 } = await cromApi.request<SearchUsersQuery, SearchUsersQueryVariables>(
    SEARCH_USERS_QUERY,
    { siteUrl, query },
  );
  const userId = searchUsers_v1[0]?.wikidotUser?.id ?? searchUsers_v1[0]?.id;
  return userId ? fetchUserInfo(cromApi, userId, siteUrl) : null;
}

/** Get UserEmbedInfo for a user with a known exact case-sensitive name. */
export async function fetchUserInfo(
  cromApi: CromClient,
  id: string,
  siteUrl: string | null,
): Promise<UserEmbedInfoFragment | null> {
  if (siteUrl) {
    const { user } = await cromApi.request<
      SiteSpecificAuthorInfoByIdQuery,
      SiteSpecificAuthorInfoByIdQueryVariables
    >(SITE_SPECIFIC_AUTHOR_INFO_BY_ID_QUERY, { siteUrl, id, siteUrlString: siteUrl });
    return user ?? null;
  } else {
    const { user: allSitesUser } = await cromApi.request<
      AllSitesAuthorInfoByIdQuery,
      AllSitesAuthorInfoByIdQueryVariables
    >(ALL_SITES_AUTHOR_INFO_BY_ID_QUERY, { id });
    return allSitesUser ?? null;
  }
}
