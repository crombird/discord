import { describe, test, expect } from "bun:test";
import {
  type APIInteraction,
  type APIApplicationCommandInteractionDataOption,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";

import { findOption, getInteractionUser } from "../discord-interaction";

describe("findOption", () => {
  const options: APIApplicationCommandInteractionDataOption[] = [
    { name: "query", type: ApplicationCommandOptionType.String, value: "test query" },
    { name: "count", type: ApplicationCommandOptionType.Integer, value: 42 },
    { name: "enabled", type: ApplicationCommandOptionType.Boolean, value: true },
  ];

  test("finds string option", () => {
    const result = findOption(options, "query", ApplicationCommandOptionType.String);
    expect(result).toBe("test query");
  });

  test("finds integer option", () => {
    const result = findOption(options, "count", ApplicationCommandOptionType.Integer);
    expect(result).toBe(42);
  });

  test("finds boolean option", () => {
    const result = findOption(options, "enabled", ApplicationCommandOptionType.Boolean);
    expect(result).toBe(true);
  });

  test("returns undefined for missing option", () => {
    const result = findOption(options, "missing", ApplicationCommandOptionType.String);
    expect(result).toBeUndefined();
  });

  test("returns undefined for wrong type", () => {
    const result = findOption(options, "query", ApplicationCommandOptionType.Integer);
    expect(result).toBeUndefined();
  });

  test("returns undefined for undefined options array", () => {
    const result = findOption(undefined, "query", ApplicationCommandOptionType.String);
    expect(result).toBeUndefined();
  });
});

describe("getInteractionUser", () => {
  test("returns user from DM interaction", () => {
    const interaction = {
      user: {
        id: "123",
        username: "testuser",
        discriminator: "0",
        global_name: null,
        avatar: null,
      },
    } as unknown as APIInteraction;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(getInteractionUser(interaction)).toEqual(interaction.user!);
  });

  test("returns user from guild interaction", () => {
    const user = {
      id: "456",
      username: "guilduser",
      discriminator: "0",
      global_name: null,
      avatar: null,
    };
    const interaction = { member: { user } } as unknown as APIInteraction;

    expect(getInteractionUser(interaction)).toEqual(user);
  });
});
