import { defineMessage } from "@formatjs/intl";

export const commandName = defineMessage({
  id: "Ab0kVAfD",
  defaultMessage: "random",
  description: "The name of the /random command",
});

export const commandDescription = defineMessage({
  id: "zl11ao/B",
  defaultMessage: "Returns a random page from the wiki",
  description: "The description of the /random command",
});

export const optionTagName = defineMessage({
  id: "TSlpjqNL",
  defaultMessage: "tag-{id}",
  description: "The name of the tag-N option",
});

export const optionTagNameDescription = defineMessage({
  id: "A02HNyUP",
  defaultMessage:
    'Filter by tag. You can also use "not:[tag]", "by:[author-name]", or "crom:series-[N]".',
  description: "The description of the tag-N option",
});

export const optionInDiaryName = defineMessage({
  id: "/jKJ9Lps",
  defaultMessage: "in-diary",
  description: "The name of the in-diary option",
});

export const optionInDiaryDescription = defineMessage({
  id: "Pjs86wHp",
  defaultMessage: "Filter pages that are in your Crom account diary",
  description: "The description of the in-diary option",
});

export const optionWikiName = defineMessage({
  id: "cKlkQerm",
  defaultMessage: "wiki",
  description: "The name of the wiki option",
});

export const optionWikiDescription = defineMessage({
  id: "+bG4IV1p",
  defaultMessage: "The wiki to search in",
  description: "The description of the wiki option",
});
