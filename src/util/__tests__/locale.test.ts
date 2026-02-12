import { describe, test, expect } from "bun:test";
import { Locale as DiscordLocale } from "discord-api-types/v10";

import { getLocaleData, localizationMap } from "../locale";

describe("getLocaleData", () => {
  test("returns locale data for en-US", () => {
    const data = getLocaleData(DiscordLocale.EnglishUS);
    expect(data).toBeDefined();
    expect(data.intl).toBeDefined();
    expect(data.dateFnsLocale).toBeDefined();
  });

  test("returns en-US locale data for unknown locale", () => {
    const enUS = getLocaleData(DiscordLocale.EnglishUS);
    const unknown = getLocaleData("xx-XX");
    expect(unknown).toBe(enUS);
  });

  test("intl locale is valid", () => {
    const data = getLocaleData(DiscordLocale.EnglishUS);
    expect(data.intl.locale).toBe("en-US");
  });

  test("dateFnsLocale code is valid", () => {
    const data = getLocaleData(DiscordLocale.EnglishUS);
    expect(data.dateFnsLocale.code).toBe("en-US");
  });
});

describe("localizationMap", () => {
  // "2DwFzD54" maps to "author" in en-US.json
  const KNOWN_MESSAGE = { id: "2DwFzD54" };

  test("returns a record containing en-US key", () => {
    const map = localizationMap(KNOWN_MESSAGE);
    expect(map).toHaveProperty(DiscordLocale.EnglishUS);
  });

  test("formats known message id correctly", () => {
    const map = localizationMap(KNOWN_MESSAGE);
    expect(map[DiscordLocale.EnglishUS]).toBe("author");
  });

  test("returns only supported locales as keys", () => {
    const map = localizationMap(KNOWN_MESSAGE);
    expect(DiscordLocale).toContainValues(Object.keys(map));
  });
});
