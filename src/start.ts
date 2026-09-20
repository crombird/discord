import "./instrument";

import { join } from "node:path";

import * as Sentry from "@sentry/bun";

import { createDiscordClient } from "./common/discord";
import { CromClient } from "./common/crom";
import { TypesensePagesClient } from "./common/typesense";
import { CrawlerClient } from "./common/crawler";
import { TagConfigClient } from "./common/tag-config";
import { JevClient } from "./common/jev";
import { ContextFactory } from "./common/context-factory";
import { metricsHandler, updateInstallMetrics } from "./metrics";
import { loadCommands } from "./common/command";
import { createWebhookHandler } from "./webhook";
import { assertEnv } from "./util/environment";

import SITES from "./__generated__/sites";

// Discord environment variables
const DISCORD_TOKEN = assertEnv("DISCORD_TOKEN");
const DISCORD_PUBLIC_KEY = assertEnv("DISCORD_PUBLIC_KEY");

// Crom environment variables
const API_ENDPOINT = assertEnv("API_ENDPOINT");
const AUTH_ENDPOINT = assertEnv("AUTH_ENDPOINT");
const CROM_CLIENT_ID = assertEnv("CROM_CLIENT_ID");
const CROM_CLIENT_SECRET = assertEnv("CROM_CLIENT_SECRET");
const TYPESENSE_URL = assertEnv("TYPESENSE_URL");
const TYPESENSE_API_KEY = assertEnv("TYPESENSE_API_KEY");

// Crawler environment variables
const CRAWLER_API_URL = assertEnv("CRAWLER_API_URL");
const CRAWLER_AUTH_TOKEN = assertEnv("CRAWLER_AUTH_TOKEN");

// TypeSafe environment variables
const TYPESAFE_API_KEY = assertEnv("TYPESAFE_API_KEY");

// Fly environment variables
const METRICS_PORT = assertEnv("METRICS_PORT");

// Create clients and singleton instances
const commands = await loadCommands(join(import.meta.dir, "commands"));
const discordApi = createDiscordClient(DISCORD_TOKEN);
const cromApi = new CromClient(API_ENDPOINT, AUTH_ENDPOINT, CROM_CLIENT_ID, CROM_CLIENT_SECRET);
const typesenseApi = new TypesensePagesClient(TYPESENSE_URL, TYPESENSE_API_KEY);
const crawlerApi = new CrawlerClient(CRAWLER_API_URL, CRAWLER_AUTH_TOKEN);
const tagConfigApi = new TagConfigClient(SITES);
const jevApi = new JevClient(TYPESAFE_API_KEY);
const contextFactory = new ContextFactory(
  discordApi,
  cromApi,
  typesenseApi,
  crawlerApi,
  tagConfigApi,
  jevApi,
);
const webhookHandler = createWebhookHandler(DISCORD_PUBLIC_KEY, commands, contextFactory);

// Start discord webhook server
Bun.serve({
  routes: {
    "/health": { GET: () => new Response("OK") },
    "/webhook": { POST: webhookHandler },
  },
});

// Start internal Prometheus metrics server
Bun.serve({
  routes: {
    "/metrics": { GET: metricsHandler },
  },
  port: METRICS_PORT,
});

// Update installation in Prometheus metrics every 5 minutes
setInterval(() => {
  updateInstallMetrics(discordApi).catch((error: unknown) => {
    Sentry.captureException(error);
  });
}, 300_000);

// Populate the tag config store immediately, then keep it fresh every 2 hours.
tagConfigApi.refresh();
setInterval(() => tagConfigApi.refresh(), 7_200_000);
