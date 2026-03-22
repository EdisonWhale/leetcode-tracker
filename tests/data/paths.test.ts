import { describe, expect, test } from "vitest";

import { problems } from "@/data/problems";
import { PATH_DEFINITIONS, PATH_MEMBERSHIP } from "@/data/paths";

describe("roadmap path data", () => {
  test("defines exactly 18 roadmap nodes with valid edges", () => {
    expect(PATH_DEFINITIONS).toHaveLength(18);

    const ids = new Set(PATH_DEFINITIONS.map((path) => path.id));
    expect(ids.size).toBe(18);

    PATH_DEFINITIONS.forEach((path) => {
      path.edges.forEach((edgeId) => {
        expect(ids.has(edgeId)).toBe(true);
      });
    });
  });

  test("maps every neetcode problem into one core path and every google-only problem into one additional path", () => {
    const problemIds = new Set(problems.map((problem) => problem.id));
    const coreIds = new Map<number, string[]>();
    const additionalIds = new Map<number, string[]>();

    Object.entries(PATH_MEMBERSHIP).forEach(([pathId, membership]) => {
      membership.core.forEach((id) => {
        expect(problemIds.has(id)).toBe(true);
        coreIds.set(id, [...(coreIds.get(id) ?? []), pathId]);
      });

      membership.additional.forEach((id) => {
        expect(problemIds.has(id)).toBe(true);
        additionalIds.set(id, [...(additionalIds.get(id) ?? []), pathId]);
      });
    });

    const neetcodeProblems = problems.filter((problem) => problem.sources.includes("neetcode150"));
    neetcodeProblems.forEach((problem) => {
      expect(coreIds.get(problem.id)).toHaveLength(1);
    });

    const googleOnlyProblems = problems.filter(
      (problem) => problem.sources.includes("google tag") && !problem.sources.includes("neetcode150"),
    );
    googleOnlyProblems.forEach((problem) => {
      expect(additionalIds.get(problem.id)).toHaveLength(1);
    });
  });
});
