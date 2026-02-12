import { describe, test, expect } from "bun:test";

import { formatAttributions } from "../attribution-list";
import type { AttributionEmbedInfoFragment } from "../../__generated__/graphql";

const SITE_URL = "http://scp-wiki.wikidot.com";

function makeAttribution(
  name: string,
  type: AttributionEmbedInfoFragment["type"] = "AUTHOR",
  opts?: { date?: string; order?: number; userPageUrl?: string; patreonActive?: boolean },
): AttributionEmbedInfoFragment {
  return {
    type,
    date: opts?.date ?? null,
    order: opts?.order ?? 0,
    user: {
      __typename: "UserWikidotNameReference",
      displayName: name,
      wikidotUser: {
        userPage: opts?.userPageUrl ? { url: opts.userPageUrl } : null,
        linkedAccount: opts?.patreonActive ? { patreonIntegration: { isActive: true } } : null,
      },
    },
  };
}

describe("formatAttributions", () => {
  test("formats single attribution", () => {
    const result = formatAttributions({
      attributions: [makeAttribution("Alice")],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("Alice");
  });

  test("formats multiple attributions", () => {
    const result = formatAttributions({
      attributions: [makeAttribution("Alice"), makeAttribution("Bob")],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("Alice, Bob");
  });

  test("deduplicates by name, maintaining priority order", () => {
    const result = formatAttributions({
      attributions: [
        makeAttribution("Alice", "AUTHOR"),
        makeAttribution("Alice", "REWRITE"),
        makeAttribution("Bob", "TRANSLATOR"),
      ],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("Bob, Alice");
  });

  test("sorts by attribution type priority", () => {
    const result = formatAttributions({
      attributions: [
        makeAttribution("Rewriter", "REWRITE"),
        makeAttribution("Translator", "TRANSLATOR"),
        makeAttribution("Author", "AUTHOR"),
      ],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("Translator, Rewriter, Author");
  });

  test("sorts by date within same type (newer first)", () => {
    const result = formatAttributions({
      attributions: [
        makeAttribution("Old", "REWRITE", { date: "2020-01-01" }),
        makeAttribution("New", "REWRITE", { date: "2023-01-01" }),
      ],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("New, Old");
  });

  test("applies extra bold emphasis when italicised is true", () => {
    const result = formatAttributions({
      attributions: [makeAttribution("Alice")],
      siteUrl: SITE_URL,
      italicised: true,
    });
    expect(result).toBe("***Alice***");
  });

  test("links author page when URL matches site", () => {
    const result = formatAttributions({
      attributions: [makeAttribution("Alice", "AUTHOR", { userPageUrl: `${SITE_URL}/alice` })],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("[Alice](https://scp-wiki.wikidot.com/alice)");
  });

  test("does not link author page when URL is on different site", () => {
    const result = formatAttributions({
      attributions: [
        makeAttribution("Alice", "AUTHOR", { userPageUrl: "http://other-site.wikidot.com/alice" }),
      ],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("Alice");
  });

  test("adds patreon emoji for patrons", () => {
    const result = formatAttributions({
      attributions: [makeAttribution("Alice", "AUTHOR", { patreonActive: true })],
      siteUrl: SITE_URL,
    });
    expect(result).toContain("<:patreon_crombird:");
  });

  test("escapes markdown in display names", () => {
    const result = formatAttributions({
      attributions: [makeAttribution("User*Name*")],
      siteUrl: SITE_URL,
    });
    expect(result).toBe("User\\*Name\\*");
  });

  test("truncates when over 15 attributions by default", () => {
    const attributions = Array.from({ length: 20 }, (_, i) => makeAttribution(`User${i}`));
    const result = formatAttributions({ attributions, siteUrl: SITE_URL });
    expect(result).toEndWith(", and 5 more");
  });

  test("does not truncate when expanded is true", () => {
    const attributions = Array.from({ length: 20 }, (_, i) => makeAttribution(`User${i}`));
    const result = formatAttributions({ attributions, siteUrl: SITE_URL, expanded: true });
    expect(result).not.toContain("more");
    expect(result.split(", ")).toHaveLength(20);
  });
});
