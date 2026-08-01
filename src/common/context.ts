import type { IntlShape } from "@formatjs/intl";
import type { Locale as DateFnsLocale } from "date-fns/locale";

import type { ContextFactory } from "./context-factory";
import SITES from "../__generated__/sites";
import { getLocaleData } from "../util/locale";

interface ContextData {
  locale: string;
  defaultSiteUrl: string;
}

export class Context {
  /**
   * The factory that created this context. Used to forward static accesses.
   */
  readonly #factory: ContextFactory;

  /**
   * The site to use when one isn't explicitly provided in the command.
   */
  public readonly defaultSite: (typeof SITES)[number];

  /**
   * Localization helper for the current caller locale.
   */
  public readonly intl: IntlShape;

  /**
   * The date-fns locale for the current caller locale.
   */
  public readonly dateFnsLocale: DateFnsLocale;

  constructor(factory: ContextFactory, { defaultSiteUrl, locale }: ContextData) {
    this.#factory = factory;

    const { intl, dateFnsLocale } = getLocaleData(locale);
    this.intl = intl;
    this.dateFnsLocale = dateFnsLocale;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.defaultSite = SITES.find((site) => site.url === defaultSiteUrl)!;
  }

  /** The API client for the Discord API. */
  get discordApi() {
    return this.#factory.discordApi;
  }

  /** The API client for the Crom API. */
  get cromApi() {
    return this.#factory.cromApi;
  }

  /** The API client for the Typesense API. */
  get typesenseApi() {
    return this.#factory.typesenseApi;
  }

  /** The API client for the Crom crawler API. */
  get crawlerApi() {
    return this.#factory.crawlerApi;
  }

  /** The client holding each wiki's in-memory tag config, refreshed periodically. */
  get tagConfigApi() {
    return this.#factory.tagConfigApi;
  }

  /** Get the interaction token for a previously encountered interaction by its ID. */
  getInteractionToken(interactionId: string) {
    return this.#factory.interactionTokenCache.get(interactionId);
  }

  /** Removes this context from the guild context cache. */
  clearCacheByGuild(guildId: string) {
    this.#factory.guildContextCache.delete(guildId);
  }

  /** Removes this context from the user context cache. */
  clearCacheByUser(userId: string) {
    this.#factory.userContextCache.delete(userId);
  }
}
