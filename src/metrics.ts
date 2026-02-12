import client from "prom-client";
import { Routes, type APIApplication } from "discord-api-types/v10";

import type { RESTWithTypeParameters } from "./common/discord";

const SHARED_LABELS = [
  "command", // 'help', 'search', 'author', etc.
] as const;

export const commandCounter = new client.Counter({
  name: "crom_discord_commands_total",
  help: "crom_discord_commands_total",
  labelNames: SHARED_LABELS,
});

export const guildCounter = new client.Gauge({
  name: "crom_discord_guilds_total",
  help: "crom_discord_guilds_total",
});

export const usersCounter = new client.Gauge({
  name: "crom_discord_users_total",
  help: "crom_discord_users_total",
});

export const errorCounter = new client.Counter({
  name: "crom_discord_errors_total",
  help: "crom_discord_errors_total",
  labelNames: SHARED_LABELS,
});

export const apiRequestDurationHistogram = new client.Histogram({
  name: "crom_discord_api_request_duration_seconds",
  help: "crom_discord_api_request_duration_seconds",
  labelNames: ["name"],
  buckets: [
    ...client.linearBuckets(0, 0.01, 100), // 0.01s step from 0.0 to 0.99
    ...client.linearBuckets(1, 0.1, 20), // 0.1s step from 1.0 to 2.9
    ...client.linearBuckets(3, 1, 8), // 1s step from 3.0 to 10.0
  ],
});

export const commandDurationHistogram = new client.Histogram({
  name: "crom_discord_command_duration_seconds",
  help: "crom_discord_command_duration_seconds",
  labelNames: SHARED_LABELS,
  buckets: [
    ...client.linearBuckets(0, 0.1, 30), // 0.1s step from 0.0 to 2.9
    ...client.linearBuckets(3, 1, 15), // 0.5s step from 3.0 to 10.0
  ],
});

export async function updateInstallMetrics(discordApi: RESTWithTypeParameters) {
  const app = await discordApi.get<APIApplication>(Routes.currentApplication());
  if (app.approximate_guild_count) guildCounter.set(app.approximate_guild_count);
  if (app.approximate_user_install_count) usersCounter.set(app.approximate_user_install_count);
}

export async function metricsHandler(): Promise<Response> {
  return new Response(await client.register.metrics(), {
    headers: { "content-type": "text/plain; version=0.0.4" },
  });
}
