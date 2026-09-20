import { mock, type Mock } from "bun:test";
import { LRUCache, LRUCacheWithDelete } from "mnemonist";
import { createIntl } from "@formatjs/intl";
import { enUS } from "date-fns/locale";

import type { CromClient } from "../common/crom";
import type { CrawlerClient } from "../common/crawler";
import type { TypesensePagesClient } from "../common/typesense";
import type { TagConfigClient } from "../common/tag-config";
import type { JevClient } from "../common/jev";
import type { RESTWithTypeParameters } from "../common/discord";
import type { ContextFactory } from "../common/context-factory";
import enUSMessages from "../__generated__/messages/en-US.json";

export const SAMPLE_SITES = {
  scpWikiEnglish: {
    type: "SCP_WIKI",
    url: "http://scp-wiki.wikidot.com",
    displayName: "SCP Wiki - English",
    recentlyCreatedUrl: "https://scp-wiki.wikidot.com/new-pages-feed",
    shortName: "scp-wiki-english",
  },
  scpWikiFrench: {
    type: "SCP_WIKI",
    url: "http://fondationscp.wikidot.com",
    displayName: "SCP Wiki - French",
    recentlyCreatedUrl: "https://fondationscp.wikidot.com/most-recently-created",
    shortName: "scp-wiki-french",
  },
} as const;

export const DEFAULT_SITE_URL = "http://scp-wiki.wikidot.com" as const;

const EN_US_INTL = createIntl({ locale: "en-US", messages: enUSMessages });

const NOT_IMPLEMENTED_ERROR = new Error("Not implemented");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mocked<T extends (...args: any[]) => any>(fn: T): Mock<T> {
  return fn as unknown as Mock<T>;
}

export function mockFetch(
  fetchMock: Mock<typeof fetch>,
  implementationFn: (url: string) => Response,
): Mock<typeof fetch> {
  return fetchMock.mockImplementation(((url: string) => {
    // At least the way we use fetch, the URL is always a string.
    if (typeof url !== "string") throw new Error("Expected URL to be a string");
    return Promise.resolve(implementationFn(url));
  }) as unknown as typeof fetch);
}

export function createMockCromClient(): CromClient {
  return {
    request: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
  } as unknown as CromClient;
}

export function createMockCrawlerClient(): CrawlerClient {
  return {
    checkMembership: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
  } as unknown as CrawlerClient;
}

export function createMockTypesenseClient(): TypesensePagesClient {
  return {
    request: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
  } as unknown as TypesensePagesClient;
}

export function createMockTagConfigClient(): TagConfigClient {
  return {
    refresh: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    getTags: mock(() => []),
  } as unknown as TagConfigClient;
}

export function createMockJevClient(): JevClient {
  return {
    rerankTypesenseHits: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
  } as unknown as JevClient;
}

export function createMockDiscordApi(): RESTWithTypeParameters {
  return {
    get: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    post: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    put: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    patch: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    delete: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    setToken: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
  } as unknown as RESTWithTypeParameters;
}

export function createMockContextFactory(): ContextFactory {
  return {
    discordApi: createMockDiscordApi(),
    cromApi: createMockCromClient(),
    crawlerApi: createMockCrawlerClient(),
    typesenseApi: createMockTypesenseClient(),
    tagConfigApi: createMockTagConfigClient(),
    jevApi: createMockJevClient(),
    fetchContext: mock().mockRejectedValue(NOT_IMPLEMENTED_ERROR),
    intl: EN_US_INTL,
    dateFnsLocale: enUS,

    // These can just be real caches. Their behavior won't really manifest in tests.
    guildContextCache: new LRUCacheWithDelete<string, { defaultSiteUrl: string }>(500),
    userContextCache: new LRUCacheWithDelete<string, { defaultSiteUrl?: string }>(1000),
    interactionTokenCache: new LRUCache<string, string>(1000),
  } as unknown as ContextFactory;
}
