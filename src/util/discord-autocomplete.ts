import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandAutocompleteResponse,
  type APIApplicationCommandInteractionDataOption,
  type APIApplicationCommandInteractionDataStringOption,
  type APIApplicationCommandOptionChoice,
  InteractionResponseType,
} from "discord-api-types/v10";

import SITES from "../__generated__/sites";

const SOURCE_SITES = SITES.map((site) => ({ name: site.displayName, value: site.shortName }));

export function autocompleteSites(
  interaction: APIApplicationCommandAutocompleteInteraction,
): APIApplicationCommandAutocompleteResponse {
  return autocompleteFromList(interaction, SOURCE_SITES);
}

export function autocompleteFromList(
  interaction: APIApplicationCommandAutocompleteInteraction,
  items: APIApplicationCommandOptionChoice<string>[],
): APIApplicationCommandAutocompleteResponse {
  // For now, we only autocomplete string values. Let's not go overboard.
  const focusedOption = getFocusedOption(
    interaction.data.options,
  ) as APIApplicationCommandInteractionDataStringOption;

  const matchedItems =
    focusedOption.value === ""
      ? items
      : items.filter((choice) => prefixFuzzySearch(focusedOption.value).test(choice.name));

  return {
    type: InteractionResponseType.ApplicationCommandAutocompleteResult,
    data: {
      choices:
        matchedItems.length <= 25
          ? matchedItems
          : [
              ...matchedItems.slice(0, 24),
              { name: "Keep typing to reveal more results...", value: "" },
            ],
    },
  };
}

function getFocusedOption(
  options: APIApplicationCommandInteractionDataOption[],
): APIApplicationCommandInteractionDataOption | undefined {
  for (const option of options) {
    if ("options" in option && option.options) {
      const focusedOption = getFocusedOption(option.options);
      if (focusedOption) return focusedOption;
    } else if ("focused" in option && option.focused) {
      return option;
    }
  }
}

function prefixFuzzySearch(query: string): RegExp {
  return new RegExp(
    query
      .split("")
      .map((c) => {
        // Only match alphanumeric characters.
        if (!(c >= "0" && c <= "9") && !(c >= "A" && c <= "Z") && !(c >= "a" && c <= "z")) {
          return "";
        }
        return `${c}.*`;
      })
      .join(""),
    "i",
  );
}
