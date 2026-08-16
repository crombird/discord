import { describe, expect, test } from "bun:test";

import { isAdultTag, isArtworkTag } from "../tags";

describe("isAdultTag", () => {
  test("recognizes supported adult tags", () => {
    expect(isAdultTag("_adult")).toBe(true);
    expect(isAdultTag("_người-lớn")).toBe(true);
  });

  test("rejects unrelated tags", () => {
    expect(isAdultTag("sexual")).toBe(false);
  });
});

describe("isArtworkTag", () => {
  test("recognizes supported artwork tags", () => {
    expect(isArtworkTag("artwork")).toBe(true);
    expect(isArtworkTag("hội-họa")).toBe(true);
  });

  test("rejects unrelated tags", () => {
    expect(isArtworkTag("artist")).toBe(false);
  });
});
