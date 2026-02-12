import { type Mock, describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";

import { TypesensePagesClient } from "../typesense";
import { mockFetch } from "../../util/test-utils";

const TYPESENSE_URL = "https://typesense.example.com";
const TYPESENSE_API_KEY = "test-api-key";

describe("TypesensePagesClient", () => {
  let fetchSpy: Mock<typeof fetch>;
  let client: TypesensePagesClient;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, "fetch");
    client = new TypesensePagesClient(TYPESENSE_URL, TYPESENSE_API_KEY);
  });

  afterEach(() => {
    fetchSpy.mockReset();
  });

  describe("request", () => {
    test("constructs request correctly", async () => {
      mockFetch(
        fetchSpy,
        () =>
          new Response(JSON.stringify({ page: 1, found: 0, out_of: 0, hits: [] }), {
            headers: { "content-type": "application/json" },
          }),
      );

      await client.request({ query: "SCP-173", page: 3, siteUrl: "http://scp-wiki.wikidot.com" });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [fetchUrl, fetchOptions] = fetchSpy.mock.calls[0]!;

      const url = new URL(fetchUrl as string);
      expect(url.origin).toBe(TYPESENSE_URL);
      expect(url.pathname).toBe("/collections/pages/documents/search");
      expect(url.searchParams.get("q")).toBe("SCP-173");
      expect(url.searchParams.get("page")).toBe("3");
      expect(url.searchParams.get("per_page")).toBe("5");
      expect(url.searchParams.get("filter_by")).toBe("origin:http://scp-wiki.wikidot.com");
      expect(url.searchParams.get("drop_tokens_threshold")).toBe("3");

      expect((fetchOptions?.headers as Record<string, string>)["x-typesense-api-key"]).toBe(
        TYPESENSE_API_KEY,
      );
    });

    test("includes default query_by fields without textContent", async () => {
      mockFetch(
        fetchSpy,
        () =>
          new Response(JSON.stringify({ page: 1, found: 0, out_of: 0, hits: [] }), {
            headers: { "content-type": "application/json" },
          }),
      );

      await client.request({ query: "test", page: 1, siteUrl: "http://scp-wiki.wikidot.com" });

      const url = new URL(fetchSpy.mock.calls[0]?.[0] as string);
      expect(url.searchParams.get("query_by")).toBe("publicTitle,alternateTitle,titleEmbedding");
    });

    test("includes textContent in query_by when includeTextContent is true", async () => {
      mockFetch(
        fetchSpy,
        () =>
          new Response(JSON.stringify({ page: 1, found: 0, out_of: 0, hits: [] }), {
            headers: { "content-type": "application/json" },
          }),
      );

      await client.request({
        query: "test",
        page: 1,
        siteUrl: "http://scp-wiki.wikidot.com",
        includeTextContent: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const url = new URL(fetchSpy.mock.calls[0]![0] as string);
      expect(url.searchParams.get("query_by")).toBe(
        "publicTitle,alternateTitle,textContent,titleEmbedding",
      );
    });

    test("includes highlight params when highlightFields is true", async () => {
      mockFetch(
        fetchSpy,
        () =>
          new Response(JSON.stringify({ page: 1, found: 0, out_of: 0, hits: [] }), {
            headers: { "content-type": "application/json" },
          }),
      );

      await client.request({
        query: "test",
        page: 1,
        siteUrl: "http://scp-wiki.wikidot.com",
        highlightFields: true,
      });

      const url = new URL(fetchSpy.mock.calls[0]?.[0] as string);
      expect(url.searchParams.get("highlight_fields")).toBe("textContent");
      expect(url.searchParams.get("highlight_affix_num_tokens")).toBe("2");
      expect(url.searchParams.get("num_typos")).toBe("2");
      expect(url.searchParams.get("highlight_start_tag")).toBe("<bold>");
      expect(url.searchParams.get("highlight_end_tag")).toBe("<bold>");
    });

    test("throws on HTTP error", () => {
      mockFetch(fetchSpy, () => new Response("Server Error", { status: 500 }));

      expect(() =>
        client.request({ query: "test", page: 1, siteUrl: "http://scp-wiki.wikidot.com" }),
      ).toThrowError(/HTTP 500/);
    });

    test("returns parsed response with hits", async () => {
      const mockResponse = {
        page: 1,
        found: 1,
        out_of: 100,
        hits: [
          {
            document: {
              id: "123",
              url: "https://scp-wiki.wikidot.com/scp-173",
              origin: "https://scp-wiki.wikidot.com",
              tags: ["scp", "euclid"],
              rating: 500,
              createdAt: 1234567890,
              attributions: [],
            },
            highlights: [],
          },
        ],
      };

      mockFetch(fetchSpy, () => {
        return new Response(JSON.stringify(mockResponse), {
          headers: { "content-type": "application/json" },
        });
      });

      const result = await client.request({
        query: "SCP-173",
        page: 1,
        siteUrl: "http://scp-wiki.wikidot.com",
      });

      expect(result.found).toBe(1);
      expect(result.page).toBe(1);
      expect(result.out_of).toBe(100);
      expect(result.hits).toHaveLength(1);
      expect(result.hits[0]?.document.url).toBe("https://scp-wiki.wikidot.com/scp-173");
      expect(result.hits[0]?.document.rating).toBe(500);
    });
  });
});
