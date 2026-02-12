import {
  createIntl,
  createIntlCache,
  type IntlShape,
  type MessageDescriptor,
} from "@formatjs/intl";
import { Locale as DiscordLocale } from "discord-api-types/v10";
import { type Locale as DateFnsLocale, enUS } from "date-fns/locale";

import enUSMessages from "../__generated__/messages/en-US.json";

export interface LocaleData {
  intl: IntlShape;
  dateFnsLocale: DateFnsLocale;
}

const INTL_CACHE = createIntlCache();

const EN_US_LOCALE_DATA: LocaleData = {
  intl: createIntl({ locale: "en-US", messages: enUSMessages }, INTL_CACHE),
  dateFnsLocale: enUS,
};

const LOCALE_DATA_MAP = new Map<string, LocaleData>([[DiscordLocale.EnglishUS, EN_US_LOCALE_DATA]]);

/** Get localization data for a given Discord locale. */
export function getLocaleData(locale: string): LocaleData {
  return LOCALE_DATA_MAP.get(locale) ?? EN_US_LOCALE_DATA;
}

/** Construct a static localization map for all supported locales. */
export function localizationMap(
  message: MessageDescriptor,
  values?: Record<string, string | number>,
): Record<DiscordLocale, string> {
  return Object.fromEntries(
    LOCALE_DATA_MAP.entries().map(([locale, localeData]) => [
      locale,
      localeData.intl.formatMessage(message, values),
    ]),
  ) as Record<DiscordLocale, string>;
}
