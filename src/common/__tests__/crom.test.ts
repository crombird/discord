import {
  type Mock,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
  jest,
} from "bun:test";

import { mockFetch } from "../../util/test-utils";

// Probably best to mock out remote instrumentation code.
await mock.module("@sentry/bun", () => ({
  startSpan: mock((_opts: unknown, fn: (span: unknown) => unknown) => fn({})),
  getTraceData: mock(() => ({ "sentry-trace": "test-trace" })),
}));

// Import after mocks are set up
const { CromClient } = await import("../crom");

const API_ENDPOINT = "https://api.example.com/graphql";
const AUTH_ENDPOINT = "https://auth.example.com/token";
const CLIENT_ID = "client-id";
const CLIENT_SECRET = "client-secret";

describe("CromClient", () => {
  let fetchSpy: Mock<typeof fetch>;
  let client: InstanceType<typeof CromClient>;

  beforeEach(() => {
    jest.useFakeTimers(); // The client schedules an automatic refresh.
    fetchSpy = spyOn(globalThis, "fetch");
    client = new CromClient(API_ENDPOINT, AUTH_ENDPOINT, CLIENT_ID, CLIENT_SECRET);
  });

  afterEach(() => {
    jest.useRealTimers();
    fetchSpy.mockRestore();
  });

  describe("#refreshAccessToken", () => {
    test("automatically fetches token on first request", async () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(JSON.stringify({ data: { test: true } }), {
            headers: { "content-type": "application/json" },
          });
        }
        throw new Error(`Unexpected URL`);
      });

      await client.request("query Test { test }");

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const [authRequest, apiRequest] = fetchSpy.mock.calls;

      expect(authRequest?.[0]).toBe(AUTH_ENDPOINT);
      const authOptions = authRequest?.[1];
      expect(authOptions?.method).toBe("POST");
      expect(authOptions?.headers).toEqual({
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      });
      expect(authOptions?.body).toEqual(new URLSearchParams({ grant_type: "client_credentials" }));

      expect(apiRequest?.[0]).toBe(API_ENDPOINT);
    });

    test("throws error on token fetch failure", () => {
      mockFetch(fetchSpy, () => new Response("Unauthorized", { status: 401 }));
      expect(() => client.request("query Test { test }")).toThrowError(/HTTP 401/);
    });

    test("reuses valid token without re-fetching", async () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(JSON.stringify({ data: { test: true } }), {
            headers: { "content-type": "application/json" },
          });
        }
        throw new Error(`Unexpected URL`);
      });

      await client.request("query Test { test }");
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      await client.request("query Test { test }");
      expect(fetchSpy).toHaveBeenCalledTimes(3); // Not 4, because token was reused
    });
  });

  describe("request", () => {
    test("sends correct request format without variables", async () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(JSON.stringify({ data: { test: true } }), {
            headers: { "content-type": "application/json" },
          });
        }
        throw new Error(`Unexpected URL`);
      });

      await client.request("query Test { test }");

      const lastCall = fetchSpy.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe(API_ENDPOINT);

      const options = lastCall?.[1];
      expect(options?.method).toBe("POST");
      expect((options?.headers as Record<string, string>)["content-type"]).toBe("application/json");
      expect((options?.headers as Record<string, string>).authorization).toBe("Bearer test-token");
      expect(JSON.parse(options?.body as string)).toEqual({
        query: "query Test { test }",
        variables: undefined,
      });
    });

    test("sends correct request format with variables", async () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(JSON.stringify({ data: { user: { id: "123" } } }), {
            headers: { "content-type": "application/json" },
          });
        }
        throw new Error(`Unexpected URL`);
      });

      await client.request("query GetUser($id: ID!) { user(id: $id) { id } }", {
        id: "123",
      });

      const lastCall = fetchSpy.mock.calls.at(-1);
      expect(JSON.parse(lastCall?.[1]?.body as string)).toEqual({
        query: "query GetUser($id: ID!) { user(id: $id) { id } }",
        variables: { id: "123" },
      });
    });

    test("returns data on success", async () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(JSON.stringify({ data: { user: { id: "123", name: "Test" } } }), {
            headers: { "content-type": "application/json" },
          });
        }
        throw new Error(`Unexpected URL`);
      });

      const result = await client.request<{ user: { id: string; name: string } }>(
        "query GetUser { user { id name } }",
      );

      expect(result.user.id).toBe("123");
      expect(result.user.name).toBe("Test");
    });

    test("throws on HTTP error", () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response("Internal Server Error", { status: 500 });
        }
        throw new Error(`Unexpected URL`);
      });

      expect(() => client.request("query Test { test }")).toThrowError(/HTTP 500/);
    });

    test("throws on GraphQL errors", () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(
            JSON.stringify({
              data: null,
              errors: [{ message: "Field 'unknown' not found" }],
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        throw new Error(`Unexpected URL`);
      });

      expect(() => client.request("query Test { unknown }")).toThrowError(
        /Field 'unknown' not found/,
      );
    });

    test("throws on null data without errors", () => {
      mockFetch(fetchSpy, (url) => {
        if (url === AUTH_ENDPOINT) {
          return new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              expires_in: 3600,
              scope: "read write",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        if (url === API_ENDPOINT) {
          return new Response(JSON.stringify({ data: null }), {
            headers: { "content-type": "application/json" },
          });
        }
        throw new Error(`Unexpected URL`);
      });

      expect(() => client.request("query Test { test }")).toThrowError(/No data returned from API/);
    });
  });
});
