import { type Mock, describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";

import { TagConfigClient, type SiteConfig } from "../tag-config";
import { mockFetch } from "../../util/test-utils";

const EN_URL = "http://scp-wiki.wikidot.com";
const FR_URL = "http://fondationscp.wikidot.com";
const JP_URL = "http://scp-jp.wikidot.com";

const EN_CONFIG_URL = "https://tags.example.com/en.toml";
const FR_CONFIG_URL = "https://tags.example.com/fr.toml";

const TEST_SITES: SiteConfig[] = [
  { url: EN_URL, tagConfigUrl: EN_CONFIG_URL },
  { url: FR_URL, tagConfigUrl: FR_CONFIG_URL },
  // Most sites don't publish a tag config at all.
  { url: JP_URL, tagConfigUrl: null },
];

const EN_CONFIG = `
[[tags]]
name = "scp"
description = "An SCP article."

[[tags]]
name = "Keter"
`;

const FR_CONFIG = `
[[tags]]
name = "conte"
`;

function tomlResponse(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/plain" } });
}

describe("TagConfigClient", () => {
  let fetchSpy: Mock<typeof fetch>;
  let consoleErrorSpy: Mock<typeof console.error>;
  let client: TagConfigClient;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, "fetch");
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    client = new TagConfigClient(TEST_SITES);
  });

  afterEach(() => {
    fetchSpy.mockReset();
    consoleErrorSpy.mockRestore();
  });

  describe("getTags", () => {
    test("returns an empty list before any refresh", () => {
      expect(client.getTags(EN_URL)).toEqual([]);
    });

    test("returns an empty list for an unknown site", async () => {
      mockFetch(fetchSpy, () => tomlResponse(EN_CONFIG));
      await client.refresh();

      expect(client.getTags("http://not-a-site.wikidot.com")).toEqual([]);
    });
  });

  describe("refresh", () => {
    test("stores lowercased tag names per site", async () => {
      mockFetch(fetchSpy, (url) => tomlResponse(url === EN_CONFIG_URL ? EN_CONFIG : FR_CONFIG));

      await client.refresh();

      expect(client.getTags(EN_URL)).toEqual(["scp", "keter"]);
      expect(client.getTags(FR_URL)).toEqual(["conte"]);
    });

    test("skips sites without a tag config URL", async () => {
      mockFetch(fetchSpy, () => tomlResponse(EN_CONFIG));

      await client.refresh();

      expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([EN_CONFIG_URL, FR_CONFIG_URL]);
      expect(client.getTags(JP_URL)).toEqual([]);
    });

    test("keeps previously fetched tags when a refresh fails", async () => {
      mockFetch(fetchSpy, () => tomlResponse(EN_CONFIG));
      await client.refresh();

      mockFetch(fetchSpy, () => new Response("Server Error", { status: 500 }));
      await client.refresh();

      expect(client.getTags(EN_URL)).toEqual(["scp", "keter"]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test("doesn't reject on malformed TOML", async () => {
      mockFetch(fetchSpy, () => tomlResponse("[[tags]\nname ="));

      await client.refresh();

      expect(client.getTags(EN_URL)).toEqual([]);
    });

    test("doesn't reject on TOML that doesn't match the schema", async () => {
      mockFetch(fetchSpy, () => tomlResponse(`[[tags]]\nlabel = "scp"`));

      await client.refresh();

      expect(client.getTags(EN_URL)).toEqual([]);
    });

    test("refreshes remaining sites after one fails", async () => {
      mockFetch(fetchSpy, (url) =>
        url === EN_CONFIG_URL
          ? new Response("Not Found", { status: 404 })
          : tomlResponse(FR_CONFIG),
      );

      await client.refresh();

      expect(client.getTags(EN_URL)).toEqual([]);
      expect(client.getTags(FR_URL)).toEqual(["conte"]);
    });
  });
});
