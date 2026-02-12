import { join } from "node:path";

import { Routes, type APIApplication } from "discord-api-types/v10";

import { loadCommands } from "../common/command";
import { createDiscordClient } from "../common/discord";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is not set");

const discordApi = createDiscordClient(DISCORD_TOKEN);
const application = await discordApi.get<APIApplication>(Routes.currentApplication());
const COMMANDS = await loadCommands(join(import.meta.dir, "../commands"));
await discordApi.put(Routes.applicationCommands(application.id), {
  body: COMMANDS.map((command) => command.definition),
});
