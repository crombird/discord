import { describe, test, expect } from "bun:test";

import { makePageEmbed } from "../page-embed";
import type { PageAttributionType, PageEmbedInfoFragment } from "../../../__generated__/graphql";
import type { Context } from "../../../common/context";

const SCP_WIKI_URL = "http://scp-wiki.wikidot.com";
const BACKROOMS_URL = "http://backrooms-wiki.wikidot.com";

type WikidotPageEmbedInfoFragment = Extract<PageEmbedInfoFragment, { __typename: "WikidotPage" }>;

function makeMinimalContext(): Context {
  return {} as unknown as Context;
}

function makePage(
  overrides: Partial<WikidotPageEmbedInfoFragment> = {},
): WikidotPageEmbedInfoFragment {
  return {
    __typename: "WikidotPage",
    url: "http://scp-wiki.wikidot.com/scp-173",
    title: "SCP-173",
    rating: 100,
    voteCount: 200,
    tags: [],
    createdAt: "2020-01-01",
    thumbnailUrl: null,
    summary: null,
    attributions: [],
    alternateTitles: [],
    ...overrides,
  };
}

function makeAttribution(name: string, type: PageAttributionType = "AUTHOR") {
  return {
    type,
    date: null,
    order: 0,
    user: {
      __typename: "UserWikidotNameReference" as const,
      displayName: name,
      wikidotUser: { userPage: null, linkedAccount: null },
    },
  };
}

describe("makePageEmbed", () => {
  test("sets title from page", () => {
    const embed = makePageEmbed(makeMinimalContext(), makePage(), SCP_WIKI_URL);
    expect(embed.title).toBe("SCP-173");
  });

  test("combines title with alternate title", () => {
    const page = makePage({ title: "SCP-173", alternateTitles: [{ title: "The Sculpture" }] });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.title).toBe("SCP-173 ⁠— The Sculpture");
  });

  test("truncates long titles to 256 chars", () => {
    const page = makePage({ title: "A".repeat(300) });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.title?.length).toBe(256);
    expect(embed.title).toEndWith("…");
  });

  test("converts URL to https", () => {
    const embed = makePageEmbed(makeMinimalContext(), makePage(), SCP_WIKI_URL);
    expect(embed.url).toBe("https://scp-wiki.wikidot.com/scp-173");
  });

  test("includes rating in description", () => {
    const embed = makePageEmbed(makeMinimalContext(), makePage(), SCP_WIKI_URL);
    expect(embed.description).toContain("**Rating**: +100");
  });

  test("includes summary when present", () => {
    const page = makePage({ summary: "A creepy statue that moves." });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toContain("*A creepy statue that moves.*");
  });

  test("truncates long summaries", () => {
    const page = makePage({ summary: "A".repeat(200) });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toContain("…");
  });

  test("formats single attribution", () => {
    const page = makePage({ attributions: [makeAttribution("Alice")] });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toContain("**by** *Alice*");
  });

  test("shows object class for SCP wiki pages", () => {
    const page = makePage({ tags: ["euclid"] });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toContain("**Object Class**: Euclid");
  });

  test("shows multiple object classes", () => {
    const page = makePage({ tags: ["euclid", "keter"] });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toContain("**Object Classes**: Euclid, Keter");
  });

  test("shows survival difficulty for backrooms pages", () => {
    const page = makePage({
      url: "http://backrooms-wiki.wikidot.com/level-0",
      tags: ["sd-class-1"],
    });
    const embed = makePageEmbed(makeMinimalContext(), page, BACKROOMS_URL);
    expect(embed.description).toContain("**Survival difficulty**: Class 1");
  });

  test("supports localized survival difficulty tags", () => {
    const page = makePage({ tags: ["classe-3"] });
    const embed = makePageEmbed(makeMinimalContext(), page, BACKROOMS_URL);
    expect(embed.description).toContain("**Survival difficulty**: Class 3");
  });

  test("shows upvote percentage for controversial new articles", () => {
    const page = makePage({
      rating: 10,
      voteCount: 30,
      createdAt: new Date().toISOString(),
    });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toMatch(/\d+% upvoted/);
  });

  test("does not show upvote percentage for highly rated articles", () => {
    const page = makePage({
      rating: 100,
      voteCount: 110,
      createdAt: new Date().toISOString(),
    });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).not.toContain("% upvoted");
  });

  test("includes thumbnail when present", () => {
    const page = makePage({ thumbnailUrl: "https://example.com/image.png" });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.thumbnail?.url).toStartWith("https://wsrv.nl?");
    expect(embed.thumbnail?.url).toContain("url=https%3A%2F%2Fexample.com%2Fimage.png");
  });

  test("blurs thumbnail for adult pages", () => {
    const page = makePage({
      tags: ["_adult"],
      thumbnailUrl: "https://example.com/image.png",
    });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.thumbnail?.url).toContain("blur=100");
  });

  test("shows fresh indicator for new articles", () => {
    const page = makePage({ createdAt: new Date().toISOString() });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.footer?.text).toContain("🎀 fresh");
  });

  test("shows adult indicator for adult-tagged articles", () => {
    const page = makePage({ tags: ["_adult"] });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.footer?.text).toContain("🔞 adult");
  });

  test("includes custom footer text", () => {
    const embed = makePageEmbed(makeMinimalContext(), makePage(), SCP_WIKI_URL, "Custom footer");
    expect(embed.footer?.text).toContain("Custom footer");
  });

  test("separates written and translated attributions for scp-wiki", () => {
    const page = makePage({
      attributions: [
        makeAttribution("Author", "AUTHOR"),
        makeAttribution("Translator", "TRANSLATOR"),
      ],
    });
    const embed = makePageEmbed(makeMinimalContext(), page, SCP_WIKI_URL);
    expect(embed.description).toContain("**Written by:** *Author*");
    expect(embed.description).toContain("**Translated by:** *Translator*");
  });
});
