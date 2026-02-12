import { join } from "node:path";

import { describe, test, expect } from "bun:test";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  type APIInteraction,
} from "discord-api-types/v10";

import { defineCommand, loadCommands, type Command } from "../command";

describe("defineCommand", () => {
  test("returns the exact same config object", () => {
    const config: Command<APIInteraction> = {
      definition: {
        name: "test",
        description: "A test command",
        contexts: [InteractionContextType.Guild],
        integration_types: [ApplicationIntegrationType.GuildInstall],
      },
      select: (interaction): interaction is APIInteraction => true,
      handle: () => ({ type: 1 as const }),
    };

    expect(defineCommand(config)).toBe(config); // Same reference
  });
});

describe("loadCommands", () => {
  test("doesn't throw an error", async () => {
    // None of the matchers are working properly for .not.toThrow(), but
    // if this throws an error, the test will fail anyway.
    await loadCommands(join(import.meta.dir, "../../commands"));
  });
});
