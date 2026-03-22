import { describe, expect, test } from "vitest";

import { problems } from "@/data/problems";

describe("problems dataset", () => {
  test("replaces the old bank with the deduplicated Google + NeetCode150 set", () => {
    expect(problems).toHaveLength(260);

    const titleSet = new Set(problems.map((problem) => problem.title));
    expect(titleSet.size).toBe(260);

    expect(titleSet.has("Remove Element")).toBe(false);
    expect(titleSet.has("Move Zeroes")).toBe(false);
    expect(titleSet.has("Alien Dictionary")).toBe(true);
    expect(titleSet.has("Encode and Decode Strings")).toBe(true);
  });

  test("keeps source tags for merged problems", () => {
    const byTitle = Object.fromEntries(problems.map((problem) => [problem.title, problem]));

    expect(byTitle["Two Sum"]?.sources).toEqual(["google tag", "neetcode150"]);
    expect(byTitle["Alien Dictionary"]?.sources).toEqual(["neetcode150"]);
    expect(byTitle["Palindrome Number"]?.sources).toEqual(["google tag"]);
  });
});
