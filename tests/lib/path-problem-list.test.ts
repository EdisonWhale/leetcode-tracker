import { describe, expect, test } from "vitest";

import type { Problem } from "@/data/problems";
import { filterPathProblems, sortPathProblems, type PathProblemListItem } from "@/lib/path-problem-list";

const baseProblem = {
  url: "https://leetcode.com/problems/example",
  cats: ["Array"],
} satisfies Partial<Problem>;

const items: PathProblemListItem[] = [
  {
    bucket: "core",
    problem: {
      ...baseProblem,
      id: 1,
      title: "Two Sum",
      diff: "Easy",
      sources: ["google tag", "neetcode150"],
    } as Problem,
    isDue: false,
    isDone: true,
    isInReviewQueue: false,
  },
  {
    bucket: "core",
    problem: {
      ...baseProblem,
      id: 2,
      title: "Minimum Window Substring",
      diff: "Hard",
      sources: ["neetcode150"],
    } as Problem,
    isDue: true,
    isDone: false,
    isInReviewQueue: true,
  },
  {
    bucket: "additional",
    problem: {
      ...baseProblem,
      id: 3,
      title: "Reverse Integer",
      diff: "Medium",
      sources: ["google tag"],
    } as Problem,
    isDue: false,
    isDone: false,
    isInReviewQueue: false,
  },
];

describe("path problem list helpers", () => {
  test("filters by search, bucket, difficulty, source, and status together", () => {
    const filtered = filterPathProblems(items, {
      query: "window",
      bucket: "core",
      difficulty: "Hard",
      source: "neetcode150",
      status: "due",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.problem.title).toBe("Minimum Window Substring");
  });

  test("supports source filter for shared problems", () => {
    const filtered = filterPathProblems(items, {
      query: "",
      bucket: "all",
      difficulty: "all",
      source: "both",
      status: "all",
    });

    expect(filtered.map((item) => item.problem.id)).toEqual([1]);
  });

  test("sorts roadmap items by title and difficulty", () => {
    expect(sortPathProblems(items, "title").map((item) => item.problem.title)).toEqual([
      "Minimum Window Substring",
      "Reverse Integer",
      "Two Sum",
    ]);

    expect(sortPathProblems(items, "difficulty").map((item) => item.problem.diff)).toEqual([
      "Easy",
      "Medium",
      "Hard",
    ]);
  });
});
