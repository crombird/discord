import { Type } from "typebox";
import * as Value from "typebox/value";

const MembershipCheckResponse = Type.Object({
  isMember: Type.Boolean(),
});

export class CrawlerClient {
  readonly #apiUrl: string;
  readonly #authToken: string;

  constructor(apiUrl: string, authToken: string) {
    this.#apiUrl = apiUrl;
    this.#authToken = authToken;
  }

  async checkMembership(userId: string, wikiUrl: string): Promise<boolean> {
    const response = await fetch(new URL("checks/membership", this.#apiUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#authToken}`,
      },
      body: JSON.stringify({ userId, wikiUrl }),
    });

    if (!response.ok) {
      throw new Error(`Membership check failed: ${response.status}`);
    }

    const { isMember } = Value.Parse(MembershipCheckResponse, await response.json());
    return isMember;
  }
}
