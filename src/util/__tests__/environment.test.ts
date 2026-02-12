import { describe, it, expect, beforeEach, afterEach } from "bun:test";

import { assertEnv } from "../environment";

describe("assertEnv", () => {
  describe("when an environment variable exists", () => {
    beforeEach(() => {
      Bun.env.IS_SET = "true";
    });

    afterEach(() => {
      delete Bun.env.IS_SET;
    });

    it("should return the value of the environment variable", () => {
      expect(assertEnv("IS_SET")).toBe("true");
    });
  });

  describe("when an environment variable does not exist", () => {
    it("should throw an error", () => {
      expect(() => assertEnv("NOT_SET")).toThrowError(/NOT_SET/);
    });
  });

  describe("when an environment variable is empty", () => {
    beforeEach(() => {
      Bun.env.IS_SET = "";
    });

    afterEach(() => {
      delete Bun.env.IS_SET;
    });

    it("should throw an error", () => {
      expect(() => assertEnv("IS_SET")).toThrowError(/IS_SET/);
    });
  });
});
