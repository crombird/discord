# AGENTS.md

## Contributions

- Humans creating pull requests, using code written in collaboration with agents, are welcome to contribute.
- Fully autonomous agents (either agents acting alone or independently on behalf of a human) must not contribute to issues labeled "good first issue" or "needs reproduction".

## Testing instructions

- Run checks based on the "test" job inside the .github/workflows folder.
- Update tests for the code you change if a matching test file exists for the file.

## Cursor Cloud specific instructions

- Runtime/package manager is [Bun](https://bun.sh/) (see `bun.lock`); it is preinstalled and on `PATH`. Dependencies are refreshed automatically on startup via `bun install --frozen-lockfile`.
- CI parity (mirror the `test` job in `.github/workflows/main.yml`): `bun run type-check`, `bun run lint`, `bun run formatjs-extract && bun run formatjs-verify`, and `bun test`. `formatjs-extract` regenerates `messages/en-US.json` in place; it normally leaves it unchanged, but check `git status` before committing.
- The app (`bun start`) is a Discord *interactions webhook* server, not a gateway bot. It listens on port `3000` (`/health`, `/webhook`) and a Prometheus metrics server on `METRICS_PORT` (`/metrics`). `bun start` prints nothing on a successful boot.
- Startup requires these env vars or it throws (see `src/start.ts` / `assertEnv`): `DISCORD_TOKEN`, `DISCORD_PUBLIC_KEY`, `API_ENDPOINT`, `AUTH_ENDPOINT`, `CROM_CLIENT_ID`, `CROM_CLIENT_SECRET`, `TYPESENSE_URL`, `TYPESENSE_API_KEY`, `CRAWLER_API_URL`, `CRAWLER_AUTH_TOKEN`, `METRICS_PORT`. None are needed for lint/type-check/test.
- The API clients make no network calls at construction, so the server can be booted with placeholder secrets for smoke tests. `/webhook` verifies an ed25519 signature (`x-signature-ed25519` / `x-signature-timestamp`) against `DISCORD_PUBLIC_KEY`; a valid `PING` (type 1) returns `{"type":1}`. To exercise it without real Discord credentials, generate an ed25519 keypair, set `DISCORD_PUBLIC_KEY` to the public key, and sign `timestamp + body`. Real command execution beyond `PING` needs valid crom/Discord credentials.
