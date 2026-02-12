import * as Sentry from "@sentry/bun";

const SENTRY_DSN = process.env.SENTRY_DSN;
if (!SENTRY_DSN) {
  console.error("SENTRY_DSN is not set! Sentry events will not be sent.");
}

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  ignoreTransactions: ["GET /metrics"],
  tracePropagationTargets: ["https://apiv2.crom.avn.sh"],
});
