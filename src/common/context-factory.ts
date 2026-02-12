import { LRUCache, LRUCacheWithDelete } from "mnemonist";

import { Context } from "./context";
import type { RESTWithTypeParameters } from "./discord";
import { gql, type CromClient } from "./crom";
import type { TypesensePagesClient } from "./typesense";
import type { CrawlerClient } from "./crawler";
import type {
  GetDmContextInfoQuery,
  GetDmContextInfoQueryVariables,
  GetGuildContextInfoQuery,
  GetGuildContextInfoQueryVariables,
} from "../__generated__/graphql";

const GET_GUILD_CONTEXT_INFO = gql`
  query GetGuildContextInfo($userId: String!, $guildId: String!) {
    discordGuildInfo(guildId: $guildId) {
      defaultSiteUrl
    }
    discordUserInfo(discordId: $userId) {
      defaultSiteUrl
    }
  }
`;

const GET_DM_CONTEXT_INFO = gql`
  query GetDmContextInfo($userId: String!) {
    discordUserInfo(discordId: $userId) {
      defaultSiteUrl
    }
  }
`;

interface RemoteGuildContextData {
  defaultSiteUrl: string;
}

interface RemoteUserContextData {
  defaultSiteUrl?: string;
}

interface FetchContextOptions {
  locale: string;
  userId: string;
  guildId: string | undefined;
}

const DEFAULT_SITE_URL = "http://scp-wiki.wikidot.com";

export class ContextFactory {
  public readonly guildContextCache = new LRUCacheWithDelete<string, RemoteGuildContextData>(500);
  public readonly userContextCache = new LRUCacheWithDelete<string, RemoteUserContextData>(1000);
  public readonly interactionTokenCache = new LRUCache<string, string>(1000);

  public readonly discordApi: RESTWithTypeParameters;
  public readonly cromApi: CromClient;
  public readonly typesenseApi: TypesensePagesClient;
  public readonly crawlerApi: CrawlerClient;

  constructor(
    discordApi: RESTWithTypeParameters,
    cromApi: CromClient,
    typesenseApi: TypesensePagesClient,
    crawlerApi: CrawlerClient,
  ) {
    this.discordApi = discordApi;
    this.cromApi = cromApi;
    this.typesenseApi = typesenseApi;
    this.crawlerApi = crawlerApi;
  }

  async fetchContext({ locale, userId, guildId }: FetchContextOptions): Promise<Context> {
    let userContextData = this.userContextCache.get(userId);
    let guildContextData = guildId ? this.guildContextCache.get(guildId) : undefined;

    if (guildId && (!guildContextData || !userContextData)) {
      const { discordGuildInfo, discordUserInfo } = await this.cromApi.request<
        GetGuildContextInfoQuery,
        GetGuildContextInfoQueryVariables
      >(GET_GUILD_CONTEXT_INFO, { userId, guildId });
      guildContextData = { defaultSiteUrl: discordGuildInfo.defaultSiteUrl };
      this.guildContextCache.set(guildId, guildContextData);
      userContextData = { defaultSiteUrl: discordUserInfo.defaultSiteUrl ?? undefined };
      this.userContextCache.set(userId, userContextData);
    }

    if (!guildId && !userContextData) {
      const { discordUserInfo } = await this.cromApi.request<
        GetDmContextInfoQuery,
        GetDmContextInfoQueryVariables
      >(GET_DM_CONTEXT_INFO, { userId });
      userContextData = { defaultSiteUrl: discordUserInfo.defaultSiteUrl ?? undefined };
      this.userContextCache.set(userId, userContextData);
    }

    const defaultSiteUrl =
      // User preference for site overrides guild preference.
      userContextData?.defaultSiteUrl ??
      // If no user preference, use guild preference. In a guild,
      // this will always be provided by the API.
      guildContextData?.defaultSiteUrl ??
      // Use default site if there's no user preference in a DM.
      DEFAULT_SITE_URL;

    return new Context(this, { locale, defaultSiteUrl });
  }
}
