import { describe, test, expect } from "bun:test";
import { REST } from "@discordjs/rest";

import { createDiscordClient } from "../discord";

describe("createDiscordClient", () => {
  test("creates client", () => {
    const client = createDiscordClient("test-token");
    expect(client).toBeInstanceOf(REST);
  });
});
