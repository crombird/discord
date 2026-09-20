import { describe, test, expect, beforeEach } from "bun:test";

import { Context } from "../context";
import type { ContextFactory } from "../context-factory";
import { createMockContextFactory, SAMPLE_SITES } from "../../util/test-utils";

describe("Context", () => {
  let mockFactory: ContextFactory;

  beforeEach(() => {
    mockFactory = createMockContextFactory();
  });

  describe("constructor", () => {
    test("finds matching site from SITES array", () => {
      const ctxFrench = new Context(mockFactory, {
        locale: "en-US",
        defaultSiteUrl: SAMPLE_SITES.scpWikiFrench.url,
        isPatreonSupporter: false,
      });
      expect(ctxFrench.defaultSite.url).toBe(SAMPLE_SITES.scpWikiFrench.url);
      expect(ctxFrench.defaultSite.displayName).toBe("SCP Wiki - French");
    });
  });

  describe("getInteractionToken", () => {
    test("retrieves token from cache", () => {
      mockFactory.interactionTokenCache.set("interaction-123", "token-abc");
      const ctx = new Context(mockFactory, {
        locale: "en-US",
        defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
        isPatreonSupporter: false,
      });
      expect(ctx.getInteractionToken("interaction-123")).toBe("token-abc");
    });

    test("returns undefined for non-existent token", () => {
      const ctx = new Context(mockFactory, {
        locale: "en-US",
        defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
        isPatreonSupporter: false,
      });
      expect(ctx.getInteractionToken("nonexistent")).toBeUndefined();
    });
  });

  describe("clearCacheByGuild", () => {
    test("removes entry from guild context cache", () => {
      mockFactory.guildContextCache.set("guild-123", {
        defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
      });

      const ctx = new Context(mockFactory, {
        locale: "en-US",
        defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
        isPatreonSupporter: false,
      });

      ctx.clearCacheByGuild("guild-123");
      expect(mockFactory.guildContextCache.get("guild-123")).toBeUndefined();
    });
  });

  describe("clearCacheByUser", () => {
    test("removes entry from user context cache", () => {
      mockFactory.userContextCache.set("user-123", {
        defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
      });

      const ctx = new Context(mockFactory, {
        locale: "en-US",
        defaultSiteUrl: SAMPLE_SITES.scpWikiEnglish.url,
        isPatreonSupporter: false,
      });

      ctx.clearCacheByUser("user-123");
      expect(mockFactory.userContextCache.get("user-123")).toBeUndefined();
    });
  });
});
