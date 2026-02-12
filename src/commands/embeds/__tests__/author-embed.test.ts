import { describe, test, expect } from "bun:test";
import { enUS } from "date-fns/locale";

import { makeAuthorEmbed } from "../author-embed";
import type {
  BasicUserEmbedInfoFragment,
  SiteSpecificUserEmbedInfoFragment,
} from "../../../__generated__/graphql";
import type { Context } from "../../../common/context";

const SCP_WIKI_URL = "http://scp-wiki.wikidot.com";
const BACKROOMS_URL = "http://backrooms-wiki.wikidot.com";

function makeMinimalContext(defaultSiteUrl: string): Context {
  return { defaultSite: { url: defaultSiteUrl }, dateFnsLocale: enUS } as unknown as Context;
}

type SiteSpecificUser = BasicUserEmbedInfoFragment & SiteSpecificUserEmbedInfoFragment;

function makeSampleUserStatistics(
  overrides: Partial<SiteSpecificUser["statistics"]> = {},
): SiteSpecificUser["statistics"] {
  return {
    rank: 99,
    totalRating: 100,
    meanRating: 10,
    pageCount: 10,
    pageCountScp: 5,
    pageCountTale: 3,
    pageCountGoiFormat: 1,
    pageCountObject: 0,
    pageCountLevel: 0,
    pageCountEntity: 0,
    pageCountArtwork: 0,
    ...overrides,
  };
}

function makeSiteSpecificUser(
  typename: SiteSpecificUser["__typename"],
  overrides: Partial<SiteSpecificUser> = {},
): SiteSpecificUser {
  return {
    __typename: typename,
    displayName: "TestUser",
    wikidotId: "12345",
    linkedAccount: null,
    userPage: null,
    statistics: null,
    attributedPages: { edges: [] },
    ...overrides,
  };
}

describe("makeAuthorEmbed", () => {
  test("includes rank in author name when present", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser", { statistics: makeSampleUserStatistics({ rank: 99 }) }),
      SCP_WIKI_URL,
      false,
    );
    expect(embed.author?.name).toBe("TestUser (#99)");
  });

  test("excludes rank if the user doesn't have any contributions", () => {
    const user = makeSiteSpecificUser("WikidotUser", { statistics: null });
    const embed = makeAuthorEmbed(makeMinimalContext(SCP_WIKI_URL), user, SCP_WIKI_URL, false);
    expect(embed.author?.name).toBe("TestUser");
  });

  test("includes wikidot avatar URL", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser"),
      SCP_WIKI_URL,
      false,
    );
    expect(embed.author?.icon_url).toContain("wikidot.com/avatar.php?userid=12345");
  });

  test("includes page count in description", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser", {
        statistics: makeSampleUserStatistics({ pageCount: 50 }),
      }),
      SCP_WIKI_URL,
      false,
    );
    expect(embed.description).toContain("has a total of **50** pages");
  });

  test("uses singular 'page' for count of 1", () => {
    const user = makeSiteSpecificUser("WikidotUser", {
      statistics: makeSampleUserStatistics({ pageCount: 1 }),
    });
    const embed = makeAuthorEmbed(makeMinimalContext(SCP_WIKI_URL), user, SCP_WIKI_URL, false);
    expect(embed.description).toContain("**1** page");
    expect(embed.description).not.toContain("**1** pages");
  });

  test("includes total and mean ratings", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser", {
        statistics: makeSampleUserStatistics({ totalRating: 100, meanRating: 10 }),
      }),
      SCP_WIKI_URL,
      false,
    );
    expect(embed.description).toContain(
      "with a total rating of **+100** and an average rating of **+10**",
    );
  });

  test("shows SCP wiki page type breakdown", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser", {
        statistics: makeSampleUserStatistics({
          pageCountScp: 5,
          pageCountTale: 3,
          pageCountGoiFormat: 1,
          pageCountArtwork: 1,
        }),
      }),
      SCP_WIKI_URL,
      false,
    );
    expect(embed.description).toContain("5 SCPs");
    expect(embed.description).toContain("3 tales");
    expect(embed.description).toContain("1 GoI format");
    expect(embed.description).toContain("1 artwork");
  });

  test("shows backrooms page type breakdown", () => {
    const user = makeSiteSpecificUser("WikidotUser", {
      statistics: makeSampleUserStatistics({
        pageCountLevel: 2,
        pageCountEntity: 3,
        pageCountObject: 1,
        pageCountTale: 1,
      }),
    });
    const embed = makeAuthorEmbed(makeMinimalContext(BACKROOMS_URL), user, BACKROOMS_URL, false);
    expect(embed.description).toContain("2 levels");
    expect(embed.description).toContain("3 entities");
    expect(embed.description).toContain("1 object");
    expect(embed.description).toContain("1 tale");
  });

  test("shows wiki name when siteUrl is null", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser"),
      null,
      false,
    );
    expect(embed.description).toContain("all wikis");
  });

  test("shows wiki name when different from server site", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser"),
      BACKROOMS_URL,
      false,
    );
    expect(embed.description).toContain("on **The Backrooms - English**");
  });

  test("includes latest article when present", () => {
    const user = makeSiteSpecificUser("WikidotUser", {
      attributedPages: {
        edges: [
          {
            node: {
              __typename: "WikidotPage",
              url: "http://scp-wiki.wikidot.com/test-page",
              title: "Test Page",
              alternateTitles: [],
              attributions: [{ date: "2024-01-01" }],
              rating: 50,
              createdAt: "2024-01-01",
              tags: [],
            },
          },
        ],
      },
    });
    const embed = makeAuthorEmbed(makeMinimalContext(SCP_WIKI_URL), user, SCP_WIKI_URL, false);
    expect(embed.description).toContain("Test Page");
    expect(embed.description).toContain("+50");
  });

  test("links to author page when available", () => {
    const user = makeSiteSpecificUser("WikidotUser", {
      userPage: { url: "http://scp-wiki.wikidot.com/user:testuser" },
    });
    const embed = makeAuthorEmbed(makeMinimalContext(SCP_WIKI_URL), user, SCP_WIKI_URL, false);
    expect(embed.author?.url).toBe("https://scp-wiki.wikidot.com/user:testuser");
  });

  test("shows linked indicator in footer when linked", () => {
    const embed = makeAuthorEmbed(
      makeMinimalContext(SCP_WIKI_URL),
      makeSiteSpecificUser("WikidotUser"),
      SCP_WIKI_URL,
      true,
    );
    expect(embed.footer?.text).toContain("🔗 Linked");
  });

  test("shows patreon emoji for active patrons", () => {
    const user = makeSiteSpecificUser("WikidotUser", {
      linkedAccount: { patreonIntegration: { isActive: true } },
    });
    const embed = makeAuthorEmbed(makeMinimalContext(SCP_WIKI_URL), user, SCP_WIKI_URL, false);
    expect(embed.description).toContain("<:patreon_crombird:");
  });
});
