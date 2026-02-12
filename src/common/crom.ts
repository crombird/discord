import * as Sentry from "@sentry/bun";
import { Type } from "typebox";
import * as Value from "typebox/value";

import { apiRequestDurationHistogram } from "../metrics";

const AuthTokenResponse = Type.Object({
  access_token: Type.String(),
  refresh_token: Type.Optional(Type.String()),
  token_type: Type.Literal("bearer"),
  expires_in: Type.Number(),
  scope: Type.String(),
});

const GraphQLResponse = Type.Object({
  data: Type.Union([Type.Object({}, { additionalProperties: true }), Type.Null()]),
  errors: Type.Optional(
    Type.Array(Type.Object({ message: Type.String() }, { additionalProperties: true })),
  ),
  extensions: Type.Optional(Type.Object({}, { additionalProperties: true })),
});

/** GQL tag for syntax highlighting. */
export const gql = String.raw;

export class CromClient {
  readonly #apiEndpoint: string;
  readonly #authEndpoint: string;
  readonly #clientId: string;
  readonly #clientSecret: string;

  #refreshTimeout: ReturnType<typeof setTimeout> | null = null;
  #refreshInProgress: Promise<void> | null = null;

  #accessToken: string | null = null;
  #expiresAt = 0;

  constructor(apiEndpoint: string, authEndpoint: string, clientId: string, clientSecret: string) {
    this.#apiEndpoint = apiEndpoint;
    this.#authEndpoint = authEndpoint;
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;
  }

  async #refreshAccessToken() {
    const basicAuth = Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString("base64");
    const response = await fetch(this.#authEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    if (!response.ok) {
      throw new Error(`Error while refreshing credentials: HTTP ${response.status}`);
    }

    const body = Value.Parse(AuthTokenResponse, await response.json());
    this.#accessToken = body.access_token;
    this.#expiresAt = Date.now() + body.expires_in * 1000;

    // An optimization to remove the token endpoint from the API request
    // "hot path" by making it asynchronous.
    this.#refreshTimeout = setTimeout(
      () => {
        this.#refreshInProgress = this.#refreshAccessToken().finally(() => {
          this.#refreshInProgress = null;
        });
      },
      body.expires_in * 1000 - 30_000,
    );
  }

  destroy() {
    if (this.#refreshTimeout) {
      clearTimeout(this.#refreshTimeout);
    }
  }

  async request<T, V extends Record<string, unknown> = never>(
    query: string,
    variables?: V,
  ): Promise<T> {
    await this.#refreshInProgress;

    if (this.#accessToken === null || Date.now() > this.#expiresAt + 1000) {
      await this.#refreshAccessToken();
    }

    const name = /(?:query|mutation) (\w+)/i.exec(query)?.[1] ?? "<unknown>";

    const stopTimer = apiRequestDurationHistogram.startTimer({ name });
    const response = await Sentry.startSpan({ name: "GraphQL: " + name }, () => {
      return fetch(this.#apiEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.#accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });
    });
    const secondsTaken = stopTimer();

    if (secondsTaken > 1) {
      console.warn(`Query took ${secondsTaken.toFixed(2)}s: ${name}, ${JSON.stringify(variables)}`);
    }

    if (!response.ok) {
      throw new Error(`Error while making API request: HTTP ${response.status}`);
    }

    const body = Value.Parse(GraphQLResponse, await response.json());
    if (body.errors) throw new Error(JSON.stringify(body.errors));
    if (!body.data) throw new Error("No data returned from API");
    return body.data as T;
  }
}
