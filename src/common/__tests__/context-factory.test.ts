import { describe, test, expect, beforeEach } from "bun:test";

import type { CromClient } from "../crom";
import type { CrawlerClient } from "../crawler";
import type { RESTWithTypeParameters } from "../discord";
import type { TypesensePagesClient } from "../typesense";
import type { TagConfigClient } from "../tag-config";
import type { JevClient } from "../jev";
import { ContextFactory } from "../context-factory";
import {
  createMockDiscordApi,
  createMockCromClient,
  createMockCrawlerClient,
  createMockTypesenseClient,
  createMockTagConfigClient,
  createMockJevClient,
  SAMPLE_SITES,
  mocked,
} from "../../util/test-utils";

// This is defined in context-factory.ts, but let's define it here again
// just to make it explicit.
const DEFAULT_SITE_URL = "http://scp-wiki.wikidot.com";

describe("ContextFactory", () => {
  let mockDiscordApi: RESTWithTypeParameters;
  let mockCromApi: CromClient;
  let mockCrawlerApi: CrawlerClient;
  let mockTypesenseApi: TypesensePagesClient;
  let mockTagConfigApi: TagConfigClient;
  let mockJevApi: JevClient;
  let factory: ContextFactory;

  beforeEach(() => {
    mockDiscordApi = createMockDiscordApi();
    mockCromApi = createMockCromClient();
    mockCrawlerApi = createMockCrawlerClient();
    mockTypesenseApi = createMockTypesenseClient();
    mockTagConfigApi = createMockTagConfigClient();
    mockJevApi = createMockJevClient();

    factory = new ContextFactory(
      mockDiscordApi,
      mockCromApi as unknown as CromClient,
      mockTypesenseApi,
      mockCrawlerApi,
      mockTagConfigApi,
      mockJevApi,
    );
  });

  describe("fetchContext", () => {
    describe("in guild channel", () => {
      test("selects user defaultSiteUrl if present", async () => {
        factory.userContextCache.set("user-123", {
          defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url,
        });
        factory.guildContextCache.set("guild-456", {
          defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: "guild-456",
        });
        expect(mockCromApi.request).not.toHaveBeenCalled();
        expect(ctx.defaultSite.url).toBe(SAMPLE_SITES.scpWikiFrench.url);
      });

      test("selects guild defaultSiteUrl if user defaultSiteUrl is not present", async () => {
        factory.userContextCache.set("user-123", {
          defaultSiteUrl: undefined,
        });
        factory.guildContextCache.set("guild-456", {
          defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: "guild-456",
        });
        expect(mockCromApi.request).not.toHaveBeenCalled();
        expect(ctx.defaultSite.url).toBe(SAMPLE_SITES.scpWikiEnglish.url);
      });

      test("fetches data from API only when cache is empty", async () => {
        mocked(mockCromApi.request).mockResolvedValue({
          discordGuildInfo: { defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url },
          discordUserInfo: { defaultSiteUrl: null },
        });

        // First call should fetch data from API
        await factory.fetchContext({ locale: "en-US", userId: "user-123", guildId: "guild-456" });
        // Second call should use cached data
        await factory.fetchContext({ locale: "en-US", userId: "user-123", guildId: "guild-456" });

        expect(mockCromApi.request).toHaveBeenCalledTimes(1);

        // Verify that the cache was updated
        expect(factory.guildContextCache.get("guild-456")).toEqual({
          defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url,
        });
        expect(factory.userContextCache.get("user-123")).toEqual({
          defaultSiteUrl: undefined,
          isPatreonSupporter: false,
        });
      });

      test("marks the context as a Patreon supporter when the integration is active", async () => {
        mocked(mockCromApi.request).mockResolvedValue({
          discordGuildInfo: { defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url },
          discordUserInfo: {
            defaultSiteUrl: null,
            account: { patreonIntegration: { isActive: true } },
          },
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: "guild-456",
        });

        expect(ctx.isPatreonSupporter).toBe(true);
      });

      test("doesn't mark the context as a Patreon supporter when the integration is inactive", async () => {
        mocked(mockCromApi.request).mockResolvedValue({
          discordGuildInfo: { defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url },
          discordUserInfo: {
            defaultSiteUrl: null,
            account: { patreonIntegration: { isActive: false } },
          },
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: "guild-456",
        });

        expect(ctx.isPatreonSupporter).toBe(false);
      });
    });

    describe("in DM channel", () => {
      test("selects user defaultSiteUrl if present", async () => {
        factory.userContextCache.set("user-123", {
          defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url,
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: undefined,
        });
        expect(mockCromApi.request).not.toHaveBeenCalled();
        expect(ctx.defaultSite.url).toBe(SAMPLE_SITES.scpWikiFrench.url);
      });

      test("selects defaultSiteUrl if user defaultSiteUrl is not present", async () => {
        factory.userContextCache.set("user-123", {
          defaultSiteUrl: undefined,
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: undefined,
        });
        expect(mockCromApi.request).not.toHaveBeenCalled();
        expect(ctx.defaultSite.url).toBe(DEFAULT_SITE_URL);
      });

      test("fetches data from API only when cache is empty", async () => {
        mocked(mockCromApi.request).mockResolvedValue({
          discordUserInfo: { defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url },
        });

        // First call should fetch data from API
        await factory.fetchContext({ locale: "en-US", userId: "user-123", guildId: undefined });
        // Second call should use cached data
        await factory.fetchContext({ locale: "en-US", userId: "user-123", guildId: undefined });

        expect(mockCromApi.request).toHaveBeenCalledTimes(1);

        // Verify that the cache was updated
        expect(factory.userContextCache.get("user-123")).toEqual({
          defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url,
          isPatreonSupporter: false,
        });
      });

      test("marks the context as a Patreon supporter when the integration is active", async () => {
        mocked(mockCromApi.request).mockResolvedValue({
          discordUserInfo: {
            defaultSiteUrl: null,
            account: { patreonIntegration: { isActive: true } },
          },
        });

        const ctx = await factory.fetchContext({
          locale: "en-US",
          userId: "user-123",
          guildId: undefined,
        });

        expect(ctx.isPatreonSupporter).toBe(true);
      });
    });
  });
});
