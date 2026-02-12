import { describe, test, expect } from "bun:test";

import {
  createImageCdnUrl,
  embedColor,
  httpsify,
  normalizeUrl,
  truncateText,
  escapeMarkdown,
  formatRating,
  formatFullTitle,
} from "../formatting";

describe("createImageCdnUrl", () => {
  test("creates basic proxy URL", () => {
    expect(createImageCdnUrl("https://example.com/image.png")).toBe(
      "https://wsrv.nl?url=https%3A%2F%2Fexample.com%2Fimage.png",
    );
  });

  test("includes transformations when provided", () => {
    expect(createImageCdnUrl("https://example.com/image.png", "w=100&h=100")).toBe(
      "https://wsrv.nl?url=https%3A%2F%2Fexample.com%2Fimage.png&w=100&h=100",
    );
  });
});

describe("embedColor", () => {
  test("returns default color for unknown site", () => {
    expect(embedColor("http://unknown-site.wikidot.com")).toBe(11026020);
  });

  test("returns default color for null", () => {
    expect(embedColor(null)).toBe(11026020);
  });
});

describe("httpsify", () => {
  test("converts http to https", () => {
    expect(httpsify("http://example.com")).toBe("https://example.com");
  });

  test("leaves https unchanged", () => {
    expect(httpsify("https://example.com")).toBe("https://example.com");
  });
});

describe("normalizeUrl", () => {
  test("converts www.scpwiki.com to wikidot URL", () => {
    expect(normalizeUrl("https://www.scpwiki.com/scp-173")).toBe(
      "http://scp-wiki.wikidot.com/scp-173",
    );
  });

  test("converts www.scp-wiki.net to wikidot URL", () => {
    expect(normalizeUrl("https://www.scp-wiki.net/scp-173")).toBe(
      "http://scp-wiki.wikidot.com/scp-173",
    );
  });

  test("converts https to http", () => {
    expect(normalizeUrl("https://other-site.wikidot.com/page")).toBe(
      "http://other-site.wikidot.com/page",
    );
  });
});

describe("truncateText", () => {
  test("returns text unchanged when under limit", () => {
    expect(truncateText("hello", 10)).toBe("hello");
  });

  test("truncates with ellipsis when over limit", () => {
    expect(truncateText("hello world", 8)).toBe("hello wo…");
  });

  test("trims trailing whitespace before ellipsis", () => {
    expect(truncateText("hello world", 6)).toBe("hello…");
  });
});

describe("escapeMarkdown", () => {
  test("escapes underscores before non-word characters", () => {
    expect(escapeMarkdown("hello_")).toBe("hello\\_");
  });

  test("escapes asterisks", () => {
    expect(escapeMarkdown("*bold*")).toBe("\\*bold\\*");
  });

  test("does not escape underscores within words", () => {
    expect(escapeMarkdown("snake_case")).toBe("snake_case");
  });
});

describe("formatRating", () => {
  test("adds plus sign to positive numbers", () => {
    expect(formatRating(42)).toBe("+42");
  });

  test("adds plus sign to zero", () => {
    expect(formatRating(0)).toBe("+0");
  });

  test("keeps minus sign for negative numbers", () => {
    expect(formatRating(-5)).toBe("-5");
  });
});

describe("formatFullTitle", () => {
  test("combines different wikidot and alternate titles", () => {
    expect(formatFullTitle("SCP-173", "The Sculpture")).toBe("SCP-173 ⁠— The Sculpture");
  });

  test("returns wikidot title when alternate title matches", () => {
    expect(formatFullTitle("SCP-173", "SCP-173")).toBe("SCP-173");
  });

  test("returns wikidot title when alternate is null", () => {
    expect(formatFullTitle("SCP-173", null)).toBe("SCP-173");
  });

  test("handles quoted alternate title matching wikidot title", () => {
    expect(formatFullTitle('"The Title"', "The Title")).toBe('"The Title"');
  });
});
