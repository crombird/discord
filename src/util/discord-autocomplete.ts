import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandAutocompleteResponse,
  type APIApplicationCommandInteractionDataOption,
  type APIApplicationCommandInteractionDataStringOption,
  type APIApplicationCommandOptionChoice,
  InteractionResponseType,
} from "discord-api-types/v10";
import { matchSorter } from "match-sorter";

import type { Context } from "../common/context";
import { truncateText } from "./formatting";
import SITES from "../__generated__/sites";

/** The number of choices that Discord caps autocomplete responses at. */
const MAX_CHOICES = 25;

/** The number of characters that Discord caps choice names at. */
const MAX_CHOICE_NAME_LENGTH = 100;

/** The final choice shown when the number of choices is capped. */
const OVERFLOW_CHOICE: APIApplicationCommandOptionChoice<string> = {
  name: "Keep typing to reveal more results...",
  value: "",
};

/** The default discord autocomplete choices shown for the `wiki` option. */
const SITE_CHOICES = SITES.map((site) => ({ name: site.displayName, value: site.shortName }));

/** Regex that matches the tagging convention to exclude tags (e.g. "not:<tag>"). */
const NOT_PREFIX = /^not:\s*/i;

/** Regex that matches the tagging convention to filter by author (e.g. "by:<author>"). */
const AUTHOR_PREFIX = /^by[:-]/i;

export function autocompleteSites(
  interaction: APIApplicationCommandAutocompleteInteraction,
): APIApplicationCommandAutocompleteResponse {
  return autocompleteFromList(interaction, SITE_CHOICES);
}

export function autocompleteFromList(
  interaction: APIApplicationCommandAutocompleteInteraction,
  items: APIApplicationCommandOptionChoice<string>[],
): APIApplicationCommandAutocompleteResponse {
  // For now, we only autocomplete string values. Let's not go overboard.
  const focusedOption = getFocusedOption(
    interaction.data.options,
  ) as APIApplicationCommandInteractionDataStringOption;

  let matchedItems: APIApplicationCommandOptionChoice<string>[] = items;
  if (focusedOption.value !== "") {
    matchedItems = matchSorter(items, focusedOption.value, {
      keys: ["name"],
      sorter: (rankedItems) => rankedItems, // Disable keyword-based sorting.
    });
  }

  return autocompleteResponse(matchedItems);
}

export function autocompleteTags(
  interaction: APIApplicationCommandAutocompleteInteraction,
  context: Context,
  siteUrl: string,
): APIApplicationCommandAutocompleteResponse {
  // For now, we only autocomplete string values. Let's not go overboard.
  const focusedOption = getFocusedOption(
    interaction.data.options,
  ) as APIApplicationCommandInteractionDataStringOption;
  const optionValue = focusedOption.value;
  const siteTags = context.tagConfigApi.getTags(siteUrl);

  if (optionValue === "") {
    return autocompleteResponse(
      siteTags.slice(0, MAX_CHOICES + 1).map((tag) => ({ name: tag, value: tag })),
    );
  }

  // If the tag is an author filter ("by:<author>"), don't use the tag config.
  if (AUTHOR_PREFIX.test(optionValue)) {
    return autocompleteResponse([{ name: optionValue, value: optionValue }]);
  }

  // If the site has no tags, return the option value as a choice.
  if (siteTags.length === 0) {
    return autocompleteResponse([{ name: optionValue, value: optionValue }]);
  }

  // For "not:<tag>" tags, we need to remove the prefix before filtering.
  const notPrefixMatch = NOT_PREFIX.exec(optionValue);
  const searchQuery = notPrefixMatch ? optionValue.slice(notPrefixMatch[0].length) : optionValue;
  const filteredTags = matchSorter(siteTags, searchQuery);

  return autocompleteResponse(
    filteredTags.map((tag) => {
      // Bring back the `not:` prefix in the output label since we're done with filtering.
      const reprefixed = notPrefixMatch ? `not:${tag}` : tag;
      return { name: truncateText(reprefixed, MAX_CHOICE_NAME_LENGTH), value: reprefixed };
    }),
  );
}

export function getFocusedOption(
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

function autocompleteResponse(
  choices: APIApplicationCommandOptionChoice<string>[],
): APIApplicationCommandAutocompleteResponse {
  return {
    type: InteractionResponseType.ApplicationCommandAutocompleteResult,
    data: {
      choices: (choices.length <= MAX_CHOICES
        ? choices
        : [...choices.slice(0, MAX_CHOICES - 1), OVERFLOW_CHOICE]
      ).map((choice) => ({
        name: truncateText(choice.name, MAX_CHOICE_NAME_LENGTH),
        value: choice.value,
      })),
    },
  };
}
