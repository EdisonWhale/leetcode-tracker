import { describe, expect, test } from "vitest";

import {
  buildStudyWorkspace,
  normalizeProgressData,
  normalizeSettings,
  reduceProgressAction,
} from "@/lib/study";

const sampleProblems = [
  { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", diff: "Easy", cats: ["Array", "Hash Map"] },
  { id: 2, title: "3Sum", url: "https://leetcode.com/problems/3sum", diff: "Medium", cats: ["Array", "Two Pointers"] },
  { id: 3, title: "Word Ladder", url: "https://leetcode.com/problems/word-ladder", diff: "Hard", cats: ["Graph", "BFS"] },
  { id: 4, title: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals", diff: "Medium", cats: ["Intervals", "Array"] },
  { id: 5, title: "Network Delay Time", url: "https://leetcode.com/problems/network-delay-time", diff: "Medium", cats: ["Graph", "Shortest Path"] },
] as const;

describe("normalizeProgressData", () => {
  test("migrates legacy solved records into explicit workflow and learning states", () => {
    const normalized = normalizeProgressData({
      1: {
        status: "solved",
        solvedDate: "2026-03-10",
        note: "Hash map first, then complement lookup",
        confidence: 4,
        interval: 7,
        nextReviewDate: "2026-03-17",
        reviewCount: 1,
      },
      2: {
        status: null,
        solvedDate: null,
        note: "",
      },
    });

    expect(normalized["1"]).toMatchObject({
      workflowState: "done",
      learningState: "strengthening",
      completedDate: "2026-03-10",
      nextReviewDate: "2026-03-17",
      lastConfidence: 4,
      reviewCount: 1,
    });
    expect(normalized["2"]).toMatchObject({
      workflowState: "backlog",
      learningState: "new",
      note: "",
    });
  });
});

describe("normalizeSettings", () => {
  test("preserves explicit deadlines and floors numeric settings", () => {
    const settings = normalizeSettings({
      planDeadline: "2026-04-01",
      defaultSnoozeDays: 0,
      reviewSessionSize: -4,
    });

    expect(settings).toEqual({
      planDeadline: "2026-04-01",
      defaultSnoozeDays: 1,
      reviewSessionSize: 1,
    });
  });
});

describe("reduceProgressAction", () => {
  test("complete-solve seeds review data and marks the problem done", () => {
    const next = reduceProgressAction({
      existing: undefined,
      today: "2026-03-18",
      action: {
        type: "complete-solve",
        confidence: 3,
      },
    });

    expect(next).toMatchObject({
      workflowState: "done",
      learningState: "learning",
      completedDate: "2026-03-18",
      nextReviewDate: "2026-03-21",
      interval: 3,
      reviewCount: 1,
      lastConfidence: 3,
    });
    expect(next.sessions.at(-1)).toMatchObject({
      kind: "solve",
      confidence: 3,
      date: "2026-03-18",
      nextReviewDate: "2026-03-21",
    });
  });

  test("rate-review upgrades interval and mastery based on confidence", () => {
    const next = reduceProgressAction({
      existing: {
        workflowState: "done",
        learningState: "strengthening",
        scheduledDate: "2026-03-12",
        startedDate: "2026-03-12",
        completedDate: "2026-03-12",
        note: "Need to remember Dijkstra heap invariant",
        interval: 7,
        nextReviewDate: "2026-03-18",
        reviewCount: 2,
        lastConfidence: 3,
        lastSessionDate: "2026-03-12",
        sessions: [],
      },
      today: "2026-03-18",
      action: {
        type: "rate-review",
        confidence: 4,
      },
    });

    expect(next).toMatchObject({
      learningState: "mastered",
      nextReviewDate: "2026-04-17",
      interval: 30,
      reviewCount: 3,
      lastConfidence: 4,
      lastSessionDate: "2026-03-18",
    });
    expect(next.sessions.at(-1)).toMatchObject({
      kind: "review",
      confidence: 4,
      nextReviewDate: "2026-04-17",
    });
  });
});

describe("buildStudyWorkspace", () => {
  test("spreads unfinished problems across all days through the deadline", () => {
    const workspace = buildStudyWorkspace({
      problems: sampleProblems,
      progress: normalizeProgressData({}),
      settings: {
        planDeadline: "2026-03-20",
        defaultSnoozeDays: 2,
        reviewSessionSize: 6,
      },
      today: "2026-03-18",
    });

    expect(workspace.plan.deadline).toEqual({
      date: "2026-03-20",
      totalProblemCount: 5,
      solvedProblemCount: 0,
      remainingProblemCount: 5,
      totalDays: 3,
    });
    expect(workspace.dashboard.todayNewProblemIds).toEqual([1, 2]);
    expect(workspace.plan.days.map((day) => day.problemIds)).toEqual([
      [1, 2],
      [3, 4],
      [5],
    ]);
    expect(workspace.plan.days.map((day) => day.suggestedNewCount)).toEqual([2, 2, 1]);
  });

  test("keeps due reviews separate from today's new problems and includes them in workload", () => {
    const workspace = buildStudyWorkspace({
      problems: sampleProblems,
      progress: normalizeProgressData({
        1: {
          status: "solved",
          solvedDate: "2026-03-10",
          note: "",
          confidence: 3,
          interval: 7,
          nextReviewDate: "2026-03-18",
          reviewCount: 2,
        },
      }),
      settings: {
        planDeadline: "2026-03-19",
        defaultSnoozeDays: 2,
        reviewSessionSize: 6,
      },
      today: "2026-03-18",
    });

    expect(workspace.dashboard.dueReviewIds).toEqual([1]);
    expect(workspace.dashboard.todayNewProblemIds).toEqual([2, 3]);
    expect(workspace.plan.days[0]).toMatchObject({
      date: "2026-03-18",
      dueReviewIds: [1],
      reviewLoadCount: 1,
      suggestedNewCount: 2,
      totalLoadCount: 3,
    });
    expect(workspace.insights.duePressure).toBe(1);
  });

  test("dynamically lowers the suggested new count as the remaining pool shrinks", () => {
    const workspace = buildStudyWorkspace({
      problems: sampleProblems,
      progress: normalizeProgressData({
        1: {
          status: "solved",
          solvedDate: "2026-03-10",
          note: "",
          confidence: 3,
          interval: 7,
          nextReviewDate: "2026-03-21",
          reviewCount: 1,
        },
        2: {
          status: "solved",
          solvedDate: "2026-03-11",
          note: "",
          confidence: 3,
          interval: 7,
          nextReviewDate: "2026-03-22",
          reviewCount: 1,
        },
      }),
      settings: {
        planDeadline: "2026-03-20",
        defaultSnoozeDays: 2,
        reviewSessionSize: 6,
      },
      today: "2026-03-18",
    });

    expect(workspace.plan.deadline.remainingProblemCount).toBe(3);
    expect(workspace.dashboard.todayNewProblemIds).toEqual([3]);
    expect(workspace.plan.days.map((day) => day.suggestedNewCount)).toEqual([1, 1, 1]);
    expect(workspace.plan.days.map((day) => day.problemIds)).toEqual([[3], [4], [5]]);
  });

  test("provides a usable empty record for problems without persisted progress", () => {
    const workspace = buildStudyWorkspace({
      problems: sampleProblems,
      progress: normalizeProgressData({}),
      settings: {
        planDeadline: "2026-03-20",
        defaultSnoozeDays: 2,
        reviewSessionSize: 6,
      },
      today: "2026-03-18",
    });

    expect(workspace.problemRows[0].record).toMatchObject({
      workflowState: "backlog",
      learningState: "new",
      note: "",
      scheduledDate: null,
      nextReviewDate: null,
    });
  });

  test("scopes the completion heatmap to the current plan window instead of earlier history", () => {
    const workspace = buildStudyWorkspace({
      problems: sampleProblems,
      progress: normalizeProgressData({
        1: {
          status: "solved",
          solvedDate: "2026-03-10",
          note: "",
          confidence: 3,
          interval: 7,
          nextReviewDate: "2026-03-21",
          reviewCount: 1,
        },
        2: {
          status: "solved",
          solvedDate: "2026-03-18",
          note: "",
          confidence: 4,
          interval: 14,
          nextReviewDate: "2026-04-01",
          reviewCount: 1,
        },
        3: {
          status: "solved",
          solvedDate: "2026-03-20",
          note: "",
          confidence: 3,
          interval: 7,
          nextReviewDate: "2026-03-27",
          reviewCount: 1,
        },
      }),
      settings: {
        planDeadline: "2026-04-01",
        defaultSnoozeDays: 2,
        reviewSessionSize: 6,
      },
      today: "2026-03-18",
    });

    expect(workspace.insights.totalCompletedCount).toBe(3);
    expect(workspace.insights.completionHistory).toMatchObject({
      windowStart: "2026-03-18",
      windowEnd: "2026-04-01",
      totalDays: 15,
    });

    const visibleDates = workspace.insights.completionHistory.weeks
      .flatMap((week) => week.days)
      .filter((day) => !day.isPlaceholder);

    expect(visibleDates[0]?.date).toBe("2026-03-18");
    expect(visibleDates.at(-1)?.date).toBe("2026-04-01");
    expect(visibleDates.some((day) => day.date === "2026-03-10")).toBe(false);
    expect(visibleDates.find((day) => day.date === "2026-03-18")?.count).toBe(1);
    expect(visibleDates.find((day) => day.date === "2026-03-20")?.count).toBe(1);
  });
});
