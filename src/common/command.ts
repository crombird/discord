import { join } from "node:path";
import { glob } from "node:fs/promises";

import {
  type APIInteraction,
  type APIInteractionResponse,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord-api-types/v10";

import type { Context } from "./context";

export interface Command<T extends APIInteraction> {
  /**
   * The command definition. This is sent straight to discord during release.
   * `contexts` and `integration_types` are required to make them explicitly defined.
   */
  definition: RESTPostAPIApplicationCommandsJSONBody &
    Required<Pick<RESTPostAPIApplicationCommandsJSONBody, "contexts" | "integration_types">>;

  /**
   * A function that determines whether the interaction matches the command.
   * A well-defined select function simplifies the handling code.
   */
  select: (interaction: APIInteraction) => interaction is T;

  /**
   * A handler for the matched interaction.
   */
  handle: (
    interaction: T,
    context: Context,
  ) => APIInteractionResponse | Promise<APIInteractionResponse>;
}

/** Helper function to default export a typechecked command. */
export function defineCommand<T extends APIInteraction>(config: Command<T>): Command<T> {
  return config;
}

/** Load all commands from a directory. */
export async function loadCommands(directoryPath: string): Promise<Command<APIInteraction>[]> {
  const commands: Command<APIInteraction>[] = [];
  for await (const modulePath of glob(join(directoryPath, "*.ts"), {
    exclude: [join(directoryPath, "*.intl.ts")],
  })) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const module = await import(modulePath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const command = module.default as unknown;
    if (
      !command ||
      typeof command !== "object" ||
      !("definition" in command && command.definition) ||
      !("select" in command && command.select) ||
      !("handle" in command && command.handle)
    ) {
      throw new Error(`${modulePath} doesn't export a valid command!`);
    }
    commands.push(command as Command<APIInteraction>);
  }
  return commands;
}
