import { describe, expect, test } from "vitest";

import { problems } from "@/data/problems";
import { buildStudyWorkspace, normalizeProgressData } from "@/lib/study";

describe("buildStudyWorkspace paths", () => {
  test("derives per-path totals and solved counts from roadmap membership", () => {
    const workspace = buildStudyWorkspace({
      problems,
      progress: normalizeProgressData({
        1: { status: "solved", solvedDate: "2026-03-10", confidence: 4, interval: 7, nextReviewDate: "2026-03-17", reviewCount: 1 },
        217: { status: "solved", solvedDate: "2026-03-11", confidence: 3, interval: 7, nextReviewDate: "2026-03-18", reviewCount: 1 },
        703: { status: "solved", solvedDate: "2026-03-12", confidence: 3, interval: 7, nextReviewDate: "2026-03-19", reviewCount: 1 },
      }),
      settings: {
        planDeadline: "2026-04-01",
        defaultSnoozeDays: 2,
        reviewSessionSize: 6,
      },
      today: "2026-03-18",
    });

    expect(workspace.paths.all).toHaveLength(18);

    const arraysHashing = workspace.paths.byId["arrays-hashing"];
    expect(arraysHashing.totalCount).toBeGreaterThan(0);
    expect(arraysHashing.solvedCount).toBeGreaterThan(0);

    const heapPriorityQueue = workspace.paths.byId["heap-priority-queue"];
    expect(heapPriorityQueue.totalCount).toBeGreaterThan(0);
    expect(heapPriorityQueue.solvedCount).toBeGreaterThan(0);
    expect(heapPriorityQueue.dueCount).toBeGreaterThanOrEqual(0);
  });
});
