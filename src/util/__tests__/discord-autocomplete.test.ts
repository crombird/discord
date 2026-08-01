import { describe, test, expect } from "bun:test";
import {
  type APIApplicationCommandAutocompleteInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  Locale,
} from "discord-api-types/v10";

import { Context } from "../../common/context";
import { autocompleteFromList, autocompleteTags, getFocusedOption } from "../discord-autocomplete";
import { createMockContextFactory, DEFAULT_SITE_URL, mocked } from "../test-utils";

function createAutocompleteInteraction(
  focusedValue: string,
  optionName = "site",
): APIApplicationCommandAutocompleteInteraction {
  return {
    id: "123",
    application_id: "456",
    type: InteractionType.ApplicationCommandAutocomplete,
    token: "token",
    version: 1,
    entitlements: [],
    authorizing_integration_owners: {},
    app_permissions: "0",
    locale: Locale.EnglishUS,
    attachment_size_limit: 25000000,
    data: {
      id: "789",
      name: "test",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: optionName,
          type: ApplicationCommandOptionType.String,
          value: focusedValue,
          focused: true,
        },
      ],
    },
  };
}

const TEST_ITEMS = [
  { name: "SCP Wiki - English", value: "scp-en" },
  { name: "SCP Wiki - French", value: "scp-fr" },
  { name: "SCP Wiki - German", value: "scp-de" },
  { name: "Wanderers Library", value: "wanderers" },
];

const TEST_TAGS = ["scp", "keter", "safe", "tale"];

const OVERFLOW_CHOICE = { name: "Keep typing to reveal more results...", value: "" };

function createTagContext(tags: string[] = TEST_TAGS): Context {
  const factory = createMockContextFactory();
  mocked(factory.tagConfigApi.getTags).mockReturnValue(tags);
  return new Context(factory, { locale: "en-US", defaultSiteUrl: DEFAULT_SITE_URL });
}

describe("autocompleteFromList", () => {
  test("returns all items when query is empty", () => {
    const interaction = createAutocompleteInteraction("");
    const result = autocompleteFromList(interaction, TEST_ITEMS);

    expect(result.type).toBe(InteractionResponseType.ApplicationCommandAutocompleteResult);
    expect(result.data.choices).toEqual(TEST_ITEMS);
  });

  test("filters items by fuzzy prefix search", () => {
    const interaction = createAutocompleteInteraction("scp");
    const result = autocompleteFromList(interaction, TEST_ITEMS);

    expect(result.data.choices).toHaveLength(3);
    expect(result.data.choices?.map((c) => c.value)).toEqual(["scp-en", "scp-fr", "scp-de"]);
  });

  test("fuzzy search matches non-consecutive characters", () => {
    const interaction = createAutocompleteInteraction("se");
    const result = autocompleteFromList(interaction, TEST_ITEMS);

    // "se" matches "SCP Wiki - English" (S...E)
    expect(result.data.choices?.some((c) => c.value === "scp-en")).toBe(true);
  });

  test("limits results to 25 with overflow message", () => {
    const manyItems = Array.from({ length: 30 }, (_, i) => ({
      name: `Item ${i}`,
      value: `item-${i}`,
    }));
    const interaction = createAutocompleteInteraction("");
    const result = autocompleteFromList(interaction, manyItems);

    expect(result.data.choices).toHaveLength(25);
    expect(result.data.choices?.[24]).toEqual(OVERFLOW_CHOICE);
  });
});

describe("autocompleteTags", () => {
  test("returns the site's tags in config order when query is empty", () => {
    const context = createTagContext();
    const interaction = createAutocompleteInteraction("", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.type).toBe(InteractionResponseType.ApplicationCommandAutocompleteResult);
    expect(result.data.choices?.map((c) => c.value)).toEqual(TEST_TAGS);
    expect(mocked(context.tagConfigApi.getTags)).toHaveBeenCalledWith(DEFAULT_SITE_URL);
  });

  test("caps an empty query at 25 choices with overflow message", () => {
    const context = createTagContext(Array.from({ length: 26 }, (_, i) => `tag-${i}`));
    const interaction = createAutocompleteInteraction("", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.data.choices).toHaveLength(25);
    expect(result.data.choices?.[23]).toEqual({ name: "tag-23", value: "tag-23" });
    expect(result.data.choices?.[24]).toEqual(OVERFLOW_CHOICE);
  });

  test("filters tags by fuzzy search", () => {
    const context = createTagContext();
    const interaction = createAutocompleteInteraction("ke", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.data.choices?.map((c) => c.value)).toEqual(["keter"]);
  });

  test("lowercases the query before filtering", () => {
    const context = createTagContext();
    const interaction = createAutocompleteInteraction("KETER", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.data.choices?.map((c) => c.value)).toEqual(["keter"]);
  });

  test("restores the `not:` prefix on filtered tags", () => {
    const context = createTagContext();
    const interaction = createAutocompleteInteraction("not:ket", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.data.choices).toEqual([{ name: "not:keter", value: "not:keter" }]);
  });

  test("echoes author filters back instead of matching tags", () => {
    const context = createTagContext();
    const interaction = createAutocompleteInteraction("by:DrEverettMann", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.data.choices).toEqual([{ name: "by:DrEverettMann", value: "by:DrEverettMann" }]);
  });

  test("echoes the query back for sites without a tag config", () => {
    const context = createTagContext([]);
    const interaction = createAutocompleteInteraction("keter", "tag-1");
    const result = autocompleteTags(interaction, context, DEFAULT_SITE_URL);

    expect(result.data.choices).toEqual([{ name: "keter", value: "keter" }]);
  });
});

describe("getFocusedOption", () => {
  test("finds an option nested in a subcommand", () => {
    const focusedOption = getFocusedOption([
      {
        name: "subcommand",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          { name: "wiki", type: ApplicationCommandOptionType.String, value: "scp-wiki-english" },
          { name: "tag-1", type: ApplicationCommandOptionType.String, value: "scp", focused: true },
        ],
      },
    ]);

    expect(focusedOption?.name).toBe("tag-1");
  });

  test("returns undefined when no option is focused", () => {
    expect(
      getFocusedOption([
        { name: "wiki", type: ApplicationCommandOptionType.String, value: "scp-wiki-english" },
      ]),
    ).toBeUndefined();
  });
});
