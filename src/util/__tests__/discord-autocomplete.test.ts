import { describe, test, expect } from "bun:test";
import {
  type APIApplicationCommandAutocompleteInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  Locale,
} from "discord-api-types/v10";

import { autocompleteFromList } from "../discord-autocomplete";

function createAutocompleteInteraction(
  focusedValue: string,
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
          name: "site",
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
    expect(result.data.choices?.[24]).toEqual({
      name: "Keep typing to reveal more results...",
      value: "",
    });
  });
});
