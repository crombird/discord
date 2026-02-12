import { defineMessage } from "@formatjs/intl";

export const commandName = defineMessage({
  id: "2DwFzD54",
  defaultMessage: "author",
  description: "The name of the /author command",
});

export const commandDescription = defineMessage({
  id: "Pqpm7GIM",
  defaultMessage: "Get information about an author from the server's current wiki",
  description: "The description of the /author command",
});

export const optionNameOrRankName = defineMessage({
  id: "28Pg4mij",
  defaultMessage: "name-or-rank",
  description: "The name of the name-or-rank option",
});

export const optionNameOrRankDescription = defineMessage({
  id: "eG7ZaBws",
  defaultMessage: 'Username to search (or a rank if you format it like "#123")',
  description: "The description of the name-or-rank option",
});

export const optionWikiName = defineMessage({
  id: "cKlkQerm",
  defaultMessage: "wiki",
  description: "The name of the wiki option",
});

export const optionWikiDescription = defineMessage({
  id: "ujiML/pG",
  defaultMessage: "An optional wiki to look in",
  description: "The description of the wiki option",
});
