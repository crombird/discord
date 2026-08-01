import * as Sentry from "@sentry/bun";
import { Type } from "typebox";
import * as Value from "typebox/value";

const TagConfig = Type.Object({
  tags: Type.Array(
    Type.Object({
      name: Type.String(),
      description: Type.Optional(Type.String()),
    }),
  ),
});

export interface SiteConfig {
  readonly url: string;
  readonly tagConfigUrl: string | null;
}

/**
 * Holds each wiki's tag list in memory, refreshed periodically from the TOML
 * tag configs that wikis publish.
 */
export class TagConfigClient {
  readonly #sites: readonly SiteConfig[];
  readonly #tagsBySiteUrl = new Map<string, string[]>();

  constructor(sites: readonly SiteConfig[]) {
    this.#sites = sites;
  }

  getTags(siteUrl: string): string[] {
    return this.#tagsBySiteUrl.get(siteUrl) ?? [];
  }

  async refresh(): Promise<void> {
    for (const site of this.#sites) {
      if (!site.tagConfigUrl) continue;
      await this.#attemptSiteRefresh(site.url, site.tagConfigUrl);
    }
  }

  async #attemptSiteRefresh(siteUrl: string, tagConfigUrl: string): Promise<void> {
    try {
      const response = await fetch(tagConfigUrl, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Error while fetching tag config: HTTP ${response.status}`);
      const text = await response.text();
      const { tags } = Value.Parse(TagConfig, Bun.TOML.parse(text));
      const tagNames = tags.map(({ name }) => name.toLowerCase());
      this.#tagsBySiteUrl.set(siteUrl, tagNames);
    } catch (error) {
      console.error(`Failed to refresh tag config for ${siteUrl}:`, error);
      Sentry.captureException(error, { extra: { siteUrl, tagConfigUrl } });
    }
  }
}
