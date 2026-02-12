import { join } from "node:path";

import { describe, test, expect } from "bun:test";

import { loadCommands } from "../common/command";

const commands = await loadCommands(join(import.meta.dir, "../commands"));

test("command definitions match snapshot", () => {
  // Sorting by name to make the order of commands in the snapshot stable.
  const commandDefinitions = commands
    .sort((a, b) => a.definition.name.localeCompare(b.definition.name))
    .map((command) => command.definition);

  expect(commandDefinitions).toMatchSnapshot();
});

describe("en-US localizations match default messages", () => {
  test.each(commands)("$definition.name", (command) => {
    expect(command.definition.name_localizations).toBeDefined();
    expect(command.definition.name_localizations?.["en-US"]).toBe(command.definition.name);
    if ("description" in command.definition) {
      expect(command.definition.description_localizations).toBeDefined();
      expect(command.definition.description_localizations?.["en-US"]).toBe(
        command.definition.description,
      );
    }
    if ("options" in command.definition && command.definition.options) {
      for (const option of command.definition.options) {
        expect(option.name_localizations).toBeDefined();
        expect(option.name_localizations?.["en-US"]).toBe(option.name);
        if ("description" in option) {
          expect(option.description_localizations).toBeDefined();
          expect(option.description_localizations?.["en-US"]).toBe(option.description);
        }
        if ("options" in option && option.options) {
          for (const suboption of option.options) {
            expect(suboption.name_localizations).toBeDefined();
            expect(suboption.name_localizations?.["en-US"]).toBe(suboption.name);
            if ("description" in suboption) {
              expect(suboption.description_localizations).toBeDefined();
              expect(suboption.description_localizations?.["en-US"]).toBe(suboption.description);
            }
          }
        }
        if ("choices" in option && option.choices) {
          for (const choice of option.choices) {
            expect(choice.name_localizations).toBeDefined();
            expect(choice.name_localizations?.["en-US"]).toBe(choice.name);
          }
        }
      }
    }
  });
});
