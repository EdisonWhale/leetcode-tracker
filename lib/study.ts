import type { Problem } from "@/data/problems";
import { PATH_DEFINITIONS, PATH_MEMBERSHIP, type PathDefinition, type PathId } from "@/data/paths";
import { addDays, buildDateRange, diffDays, formatMonthDay, getLocalDate, weekdayLabel } from "@/lib/dates";

const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];

export type Confidence = 1 | 2 | 3 | 4;
export type WorkflowState = "backlog" | "active" | "done";
export type LearningState = "new" | "learning" | "strengthening" | "mastered";

export interface StudySession {
  kind: "solve" | "review" | "snooze";
  date: string;
  confidence: Confidence | null;
  intervalAfter: number;
  nextReviewDate: string | null;
}

export interface StudyProgressRecord {
  workflowState: WorkflowState;
  learningState: LearningState;
  scheduledDate: string | null;
  startedDate: string | null;
  completedDate: string | null;
  note: string;
  interval: number;
  nextReviewDate: string | null;
  reviewCount: number;
  lastConfidence: Confidence | null;
  lastSessionDate: string | null;
  sessions: StudySession[];
}

export interface StudySettings {
  planDeadline: string;
  defaultSnoozeDays: number;
  reviewSessionSize: number;
}

type LegacyRecord = {
  status?: "solved" | "review" | null;
  solvedDate?: string | null;
  note?: string;
  confidence?: Confidence | null;
  interval?: number;
  nextReviewDate?: string | null;
  reviewCount?: number;
};

type MixedRecord = Partial<StudyProgressRecord> & LegacyRecord;

export interface StudyWorkspace {
  dashboard: {
    dueReviewIds: number[];
    overdueReviewIds: number[];
    todayNewProblemIds: number[];
    activeProblemIds: number[];
    completedTodayIds: number[];
    dueReviewCount: number;
    todayNewCount: number;
    overdueCount: number;
  };
  plan: {
    deadline: {
      date: string;
      totalProblemCount: number;
      solvedProblemCount: number;
      remainingProblemCount: number;
      totalDays: number;
    };
    days: Array<{
      date: string;
      label: string;
      isToday: boolean;
      problemIds: number[];
      dueReviewIds: number[];
      suggestedNewCount: number;
      reviewLoadCount: number;
      totalLoadCount: number;
      remainingProblemCount: number;
      capacity: number;
    }>;
  };
  review: {
    dueNowIds: number[];
    upcomingIds: number[];
    masteredIds: number[];
  };
  reminders: {
    dueReviewCount: number;
    overdueReviewCount: number;
    todayFreshCount: number;
    todayTarget: number;
    remainingFreshCount: number;
    shouldHighlightReviews: boolean;
    shouldHighlightFreshTarget: boolean;
  };
  insights: {
    completionRate: number;
    totalCompletedCount: number;
    duePressure: number;
    completionHistory: {
      maxDailyCount: number;
      windowStart: string;
      windowEnd: string;
      totalDays: number;
      weeks: Array<{
        weekStart: string;
        monthLabel: string | null;
        days: Array<{
          date: string | null;
          count: number;
          level: 0 | 1 | 2 | 3 | 4;
          isToday: boolean;
          isFuture: boolean;
          isPlaceholder: boolean;
        }>;
      }>;
    };
    topicHealth: Array<{
      topic: string;
      totalCount: number;
      backlogCount: number;
      dueCount: number;
      masteredCount: number;
      activeCount: number;
    }>;
  };
  paths: {
    all: PathWorkspace[];
    byId: Record<PathId, PathWorkspace>;
  };
  problemRows: Array<{
    problem: Problem;
    record: StudyProgressRecord;
    statusLabel: string;
    nextAction: "solve" | "review" | "open";
    isDue: boolean;
    isInReviewQueue: boolean;
    firstCompletedDate: string | null;
    firstCompletedLabel: string;
    scheduledLabel: string | null;
    reviewLabel: string | null;
  }>;
}

export interface PathWorkspace {
  id: PathId;
  definition: PathDefinition;
  coreIds: number[];
  additionalIds: number[];
  totalProblemIds: number[];
  coreCount: number;
  additionalCount: number;
  totalCount: number;
  solvedCount: number;
  dueCount: number;
  progressPercent: number;
  sourceCounts: {
    neetcode150: number;
    googleTag: number;
    both: number;
  };
  difficultyCounts: {
    easy: number;
    medium: number;
    hard: number;
  };
  solvedDifficultyCounts: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export type ProgressAction =
  | { type: "schedule"; scheduledDate: string | null }
  | { type: "start-solve" }
  | { type: "complete-solve"; confidence: Confidence }
  | { type: "rate-review"; confidence: Confidence }
  | { type: "snooze-review"; days?: number }
  | { type: "save-note"; note: string }
  | { type: "clear-progress" };

export const DEFAULT_SETTINGS: StudySettings = {
  planDeadline: addDays(getLocalDate(), 14),
  defaultSnoozeDays: 2,
  reviewSessionSize: 6,
};

function emptyRecord(): StudyProgressRecord {
  return {
    workflowState: "backlog",
    learningState: "new",
    scheduledDate: null,
    startedDate: null,
    completedDate: null,
    note: "",
    interval: 0,
    nextReviewDate: null,
    reviewCount: 0,
    lastConfidence: null,
    lastSessionDate: null,
    sessions: [],
  };
}

function normalizeConfidence(value: number | null | undefined): Confidence | null {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  return null;
}

function deriveLearningState(interval: number, workflowState: WorkflowState): LearningState {
  if (workflowState !== "done") {
    return "new";
  }
  if (interval >= 30) {
    return "mastered";
  }
  if (interval >= 7) {
    return "strengthening";
  }
  return "learning";
}

function calcNextInterval(currentInterval: number, confidence: Confidence): number {
  if (confidence === 1) {
    return 1;
  }
  if (confidence === 2) {
    return Math.max(currentInterval, 1);
  }
  const nextIndex = REVIEW_INTERVALS.findIndex((interval) => interval > currentInterval);
  if (confidence === 3) {
    return nextIndex >= 0 ? REVIEW_INTERVALS[nextIndex] : REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
  }
  const skipIndex = Math.min(nextIndex + 1, REVIEW_INTERVALS.length - 1);
  return REVIEW_INTERVALS[skipIndex >= 0 ? skipIndex : REVIEW_INTERVALS.length - 1];
}

function normalizeNewRecord(record: MixedRecord): StudyProgressRecord {
  const base = emptyRecord();
  const workflowState = record.workflowState ?? base.workflowState;
  const interval = record.interval ?? base.interval;

  return {
    ...base,
    ...record,
    workflowState,
    learningState: record.learningState ?? deriveLearningState(interval, workflowState),
    note: record.note ?? "",
    interval,
    nextReviewDate: record.nextReviewDate ?? null,
    reviewCount: record.reviewCount ?? 0,
    lastConfidence: normalizeConfidence(record.lastConfidence ?? record.confidence ?? null),
    sessions: record.sessions ?? [],
    scheduledDate: record.scheduledDate ?? null,
    startedDate: record.startedDate ?? null,
    completedDate: record.completedDate ?? null,
    lastSessionDate: record.lastSessionDate ?? null,
  };
}

function normalizeLegacyRecord(record: LegacyRecord): StudyProgressRecord {
  const workflowState: WorkflowState = record.status ? "done" : "backlog";
  const interval = record.interval ?? 0;
  const confidence = normalizeConfidence(record.confidence ?? null);
  const solvedDate = record.solvedDate ?? null;
  const nextReviewDate = record.nextReviewDate ?? null;

  return {
    workflowState,
    learningState: deriveLearningState(interval, workflowState),
    scheduledDate: null,
    startedDate: solvedDate,
    completedDate: solvedDate,
    note: record.note ?? "",
    interval,
    nextReviewDate,
    reviewCount: record.reviewCount ?? 0,
    lastConfidence: confidence,
    lastSessionDate: solvedDate,
    sessions: solvedDate && confidence
      ? [
          {
            kind: "solve",
            date: solvedDate,
            confidence,
            intervalAfter: interval,
            nextReviewDate,
          },
        ]
      : [],
  };
}

export function normalizeProgressData(records: Record<string, MixedRecord>): Record<string, StudyProgressRecord> {
  return Object.fromEntries(
    Object.entries(records).map(([key, value]) => {
      const normalized = value && "workflowState" in value
        ? normalizeNewRecord(value)
        : normalizeLegacyRecord(value ?? {});
      return [key, normalized];
    }),
  );
}

export function normalizeSettings(input?: Partial<StudySettings>): StudySettings {
  const fallbackDeadline = DEFAULT_SETTINGS.planDeadline;
  const planDeadline = typeof input?.planDeadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.planDeadline)
    ? input.planDeadline
    : fallbackDeadline;

  return {
    planDeadline,
    defaultSnoozeDays: Math.max(1, input?.defaultSnoozeDays ?? DEFAULT_SETTINGS.defaultSnoozeDays),
    reviewSessionSize: Math.max(1, input?.reviewSessionSize ?? DEFAULT_SETTINGS.reviewSessionSize),
  };
}

export function reduceProgressAction({
  existing,
  action,
  today,
  settings,
}: {
  existing?: MixedRecord;
  action: ProgressAction;
  today: string;
  settings?: Partial<StudySettings>;
}): StudyProgressRecord {
  const safeSettings = normalizeSettings(settings);
  const current = existing
    ? ("workflowState" in existing ? normalizeNewRecord(existing) : normalizeLegacyRecord(existing))
    : emptyRecord();

  switch (action.type) {
    case "schedule":
      return {
        ...current,
        scheduledDate: action.scheduledDate,
      };
    case "start-solve":
      return {
        ...current,
        workflowState: "active",
        startedDate: current.startedDate ?? today,
        scheduledDate: current.scheduledDate ?? today,
      };
    case "complete-solve": {
      const interval = calcNextInterval(Math.max(current.interval, 1), action.confidence);
      const nextReviewDate = addDays(today, interval);
      const sessions = current.sessions.concat({
        kind: "solve",
        date: today,
        confidence: action.confidence,
        intervalAfter: interval,
        nextReviewDate,
      });

      return {
        ...current,
        workflowState: "done",
        learningState: deriveLearningState(interval, "done"),
        startedDate: current.startedDate ?? today,
        completedDate: today,
        interval,
        nextReviewDate,
        reviewCount: current.reviewCount + 1,
        lastConfidence: action.confidence,
        lastSessionDate: today,
        sessions,
      };
    }
    case "rate-review": {
      const interval = calcNextInterval(Math.max(current.interval, 1), action.confidence);
      const nextReviewDate = addDays(today, interval);
      const sessions = current.sessions.concat({
        kind: "review",
        date: today,
        confidence: action.confidence,
        intervalAfter: interval,
        nextReviewDate,
      });

      return {
        ...current,
        workflowState: "done",
        learningState: deriveLearningState(interval, "done"),
        interval,
        nextReviewDate,
        reviewCount: current.reviewCount + 1,
        lastConfidence: action.confidence,
        lastSessionDate: today,
        sessions,
      };
    }
    case "snooze-review": {
      const snoozeBase = current.nextReviewDate && current.nextReviewDate > today ? current.nextReviewDate : today;
      const nextReviewDate = addDays(snoozeBase, action.days ?? safeSettings.defaultSnoozeDays);
      return {
        ...current,
        nextReviewDate,
        lastSessionDate: today,
        sessions: current.sessions.concat({
          kind: "snooze",
          date: today,
          confidence: null,
          intervalAfter: current.interval,
          nextReviewDate,
        }),
      };
    }
    case "save-note":
      return {
        ...current,
        note: action.note,
      };
    case "clear-progress":
      return emptyRecord();
    default:
      return current;
  }
}

function buildDeadlinePlan({
  problems,
  progress,
  deadline,
  today,
}: {
  problems: readonly Problem[];
  progress: Record<string, StudyProgressRecord>;
  deadline: string;
  today: string;
}) {
  const totalDays = Math.max(diffDays(today, deadline) + 1, 1);
  const dates = buildDateRange(today, totalDays);
  const daySlots = new Map(
    dates.map((date) => [
      date,
      {
        date,
        problemIds: [] as number[],
      },
    ]),
  );

  const unsolvedProblems = problems.filter((problem) => progress[String(problem.id)]?.workflowState !== "done");

  unsolvedProblems.forEach((problem) => {
    const record = progress[String(problem.id)] ?? emptyRecord();
    if (record.scheduledDate && daySlots.has(record.scheduledDate)) {
      daySlots.get(record.scheduledDate)?.problemIds.push(problem.id);
    }
  });

  const overflowPool = unsolvedProblems.filter((problem) => {
    const record = progress[String(problem.id)] ?? emptyRecord();
    return !record.scheduledDate || !daySlots.has(record.scheduledDate);
  });

  let poolIndex = 0;
  let remainingProblemCount = unsolvedProblems.length;

  return dates.map((date, index) => {
    const slot = daySlots.get(date);
    if (!slot) {
      return {
        date,
        problemIds: [],
        suggestedNewCount: 0,
        remainingProblemCount,
      };
    }

    const remainingDays = dates.length - index;
    const suggestedNewCount = Math.max(
      slot.problemIds.length,
      remainingDays > 0 ? Math.ceil(remainingProblemCount / remainingDays) : slot.problemIds.length,
    );

    while (slot.problemIds.length < suggestedNewCount && poolIndex < overflowPool.length) {
      slot.problemIds.push(overflowPool[poolIndex].id);
      poolIndex += 1;
    }

    remainingProblemCount = Math.max(0, remainingProblemCount - slot.problemIds.length);

    return {
      date,
      problemIds: slot.problemIds,
      suggestedNewCount: slot.problemIds.length,
      remainingProblemCount,
    };
  });
}

function statusLabel(record: StudyProgressRecord, today: string): string {
  if (record.workflowState === "active") {
    return "In Progress";
  }
  if (record.workflowState === "done" && record.nextReviewDate) {
    const delta = diffDays(today, record.nextReviewDate);
    if (delta < 0) {
      return `Overdue ${Math.abs(delta)}d`;
    }
    if (delta === 0) {
      return "Due Today";
    }
    if (delta === 1) {
      return "Review Tomorrow";
    }
    return `Review in ${delta}d`;
  }
  if (record.scheduledDate === today) {
    return "Planned Today";
  }
  if (record.scheduledDate) {
    return `Planned ${formatMonthDay(record.scheduledDate)}`;
  }
  return "Backlog";
}

function reviewLabel(record: StudyProgressRecord, today: string): string | null {
  if (!record.nextReviewDate) {
    return null;
  }
  const delta = diffDays(today, record.nextReviewDate);
  if (delta < 0) {
    return `Overdue ${Math.abs(delta)}d`;
  }
  if (delta === 0) {
    return "Due today";
  }
  if (delta === 1) {
    return "Tomorrow";
  }
  return `In ${delta}d`;
}

function firstCompletedDate(record: StudyProgressRecord): string | null {
  const firstSolveDate = record.sessions
    .filter((session) => session.kind === "solve")
    .map((session) => session.date)
    .sort()[0];

  return firstSolveDate ?? record.completedDate ?? null;
}

function contributionLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }
  const ratio = count / maxCount;
  if (ratio >= 0.85) {
    return 4;
  }
  if (ratio >= 0.6) {
    return 3;
  }
  if (ratio >= 0.3) {
    return 2;
  }
  return 1;
}

function buildPathWorkspace({
  problems,
  progress,
  today,
}: {
  problems: readonly Problem[];
  progress: Record<string, StudyProgressRecord>;
  today: string;
}): StudyWorkspace["paths"] {
  const problemById = new Map(problems.map((problem) => [problem.id, problem] as const));

  const all = PATH_DEFINITIONS.map((definition) => {
    const membership = PATH_MEMBERSHIP[definition.id];
    const totalProblemIds = membership.core.concat(membership.additional);

    const counts = totalProblemIds.reduce(
      (acc, problemId) => {
        const problem = problemById.get(problemId);
        if (!problem) {
          return acc;
        }

        const record = progress[String(problem.id)] ?? emptyRecord();
        const isDone = record.workflowState === "done";

        if (isDone) {
          acc.solvedCount += 1;
        }
        if (isDone && record.nextReviewDate && record.nextReviewDate <= today) {
          acc.dueCount += 1;
        }

        if (problem.sources.includes("google tag")) {
          acc.sourceCounts.googleTag += 1;
        }
        if (problem.sources.includes("neetcode150")) {
          acc.sourceCounts.neetcode150 += 1;
        }
        if (problem.sources.includes("google tag") && problem.sources.includes("neetcode150")) {
          acc.sourceCounts.both += 1;
        }

        if (problem.diff === "Easy") {
          acc.difficultyCounts.easy += 1;
          if (isDone) acc.solvedDifficultyCounts.easy += 1;
        } else if (problem.diff === "Medium") {
          acc.difficultyCounts.medium += 1;
          if (isDone) acc.solvedDifficultyCounts.medium += 1;
        } else {
          acc.difficultyCounts.hard += 1;
          if (isDone) acc.solvedDifficultyCounts.hard += 1;
        }

        return acc;
      },
      {
        solvedCount: 0,
        dueCount: 0,
        sourceCounts: {
          neetcode150: 0,
          googleTag: 0,
          both: 0,
        },
        difficultyCounts: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
        solvedDifficultyCounts: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
      },
    );

    const totalCount = totalProblemIds.length;

    return {
      id: definition.id,
      definition,
      coreIds: membership.core,
      additionalIds: membership.additional,
      totalProblemIds,
      coreCount: membership.core.length,
      additionalCount: membership.additional.length,
      totalCount,
      solvedCount: counts.solvedCount,
      dueCount: counts.dueCount,
      progressPercent: totalCount === 0 ? 0 : Math.round((counts.solvedCount / totalCount) * 100),
      sourceCounts: counts.sourceCounts,
      difficultyCounts: counts.difficultyCounts,
      solvedDifficultyCounts: counts.solvedDifficultyCounts,
    };
  });

  return {
    all,
    byId: Object.fromEntries(all.map((path) => [path.id, path])) as Record<PathId, PathWorkspace>,
  };
}

function weekStart(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return addDays(dateStr, -date.getDay());
}

function monthLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(year, month - 1, day));
}

function buildCompletionHistory({
  problems,
  progress,
  today,
  deadline,
}: {
  problems: readonly Problem[];
  progress: Record<string, StudyProgressRecord>;
  today: string;
  deadline: string;
}) {
  const completedCounts = new Map<string, number>();

  problems.forEach((problem) => {
    const completedDate = progress[String(problem.id)]?.completedDate;
    if (!completedDate) {
      return;
    }
    completedCounts.set(completedDate, (completedCounts.get(completedDate) ?? 0) + 1);
  });

  const totalCompletedCount = [...completedCounts.values()].reduce((sum, value) => sum + value, 0);
  const windowStart = today;
  const windowEnd = deadline < today ? today : deadline;
  const totalDays = Math.max(diffDays(windowStart, windowEnd) + 1, 1);
  const maxDailyCount = Math.max(
    0,
    ...buildDateRange(windowStart, totalDays).map((date) => completedCounts.get(date) ?? 0),
  );
  const firstWeekStart = weekStart(windowStart);
  const startOffset = diffDays(firstWeekStart, windowStart);
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;
  let previousWeekLabel: string | null = null;

  const weeks = Array.from({ length: totalCells / 7 }, (_, weekIndex) => {
    const start = addDays(firstWeekStart, weekIndex * 7);
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(start, dayIndex);
      const isPlaceholder = date < windowStart || date > windowEnd;
      const count = isPlaceholder ? 0 : completedCounts.get(date) ?? 0;

      return {
        date: isPlaceholder ? null : date,
        count,
        level: isPlaceholder || date > today ? 0 : contributionLevel(count, maxDailyCount),
        isToday: !isPlaceholder && date === today,
        isFuture: !isPlaceholder && date > today,
        isPlaceholder,
      };
    });

    const visibleDates = days.filter((day) => !day.isPlaceholder).map((day) => day.date).filter(Boolean) as string[];
    const monthAnchor = visibleDates.find((date) => date.endsWith("-01")) ?? visibleDates[0] ?? null;
    const currentWeekLabel = monthAnchor ? monthLabel(monthAnchor) : null;
    const label = weekIndex === 0 || (currentWeekLabel && currentWeekLabel !== previousWeekLabel)
      ? currentWeekLabel
      : null;

    if (currentWeekLabel) {
      previousWeekLabel = currentWeekLabel;
    }

    return {
      weekStart: start,
      monthLabel: label,
      days,
    };
  });

  return {
    totalCompletedCount,
    completionHistory: {
      maxDailyCount,
      windowStart,
      windowEnd,
      totalDays,
      weeks,
    },
  };
}

export function buildStudyWorkspace({
  problems,
  progress,
  settings,
  today,
}: {
  problems: readonly Problem[];
  progress: Record<string, MixedRecord>;
  settings?: Partial<StudySettings>;
  today: string;
}): StudyWorkspace {
  const normalizedProgress = normalizeProgressData(progress);
  const safeSettings = normalizeSettings(settings);
  const effectiveDeadline = safeSettings.planDeadline < today ? today : safeSettings.planDeadline;
  const planDays = buildDeadlinePlan({
    problems,
    progress: normalizedProgress,
    deadline: effectiveDeadline,
    today,
  });

  const dueReviewIds = problems
    .filter((problem) => {
      const record = normalizedProgress[String(problem.id)] ?? emptyRecord();
      return record.workflowState === "done" && !!record.nextReviewDate && record.nextReviewDate <= today;
    })
    .map((problem) => problem.id);

  const overdueReviewIds = problems
    .filter((problem) => {
      const record = normalizedProgress[String(problem.id)] ?? emptyRecord();
      return record.workflowState === "done" && !!record.nextReviewDate && record.nextReviewDate < today;
    })
    .map((problem) => problem.id);

  const todayNewProblemIds = planDays[0]?.problemIds ?? [];
  const activeProblemIds = problems
    .filter((problem) => normalizedProgress[String(problem.id)]?.workflowState === "active")
    .map((problem) => problem.id);
  const completedTodayIds = problems
    .filter((problem) => normalizedProgress[String(problem.id)]?.completedDate === today)
    .map((problem) => problem.id);

  const topicMap = new Map<string, { topic: string; totalCount: number; backlogCount: number; dueCount: number; masteredCount: number; activeCount: number }>();
  problems.forEach((problem) => {
    const topic = problem.cats[0] ?? "General";
    const record = normalizedProgress[String(problem.id)] ?? emptyRecord();
    const entry = topicMap.get(topic) ?? {
      topic,
      totalCount: 0,
      backlogCount: 0,
      dueCount: 0,
      masteredCount: 0,
      activeCount: 0,
    };

    entry.totalCount += 1;
    if (record.workflowState === "backlog") {
      entry.backlogCount += 1;
    }
    if (record.workflowState === "active") {
      entry.activeCount += 1;
    }
    if (record.workflowState === "done" && record.nextReviewDate && record.nextReviewDate <= today) {
      entry.dueCount += 1;
    }
    if (record.learningState === "mastered") {
      entry.masteredCount += 1;
    }
    topicMap.set(topic, entry);
  });

  const topicHealth = [...topicMap.values()].sort((left, right) => {
    const leftScore = left.backlogCount * 3 + left.dueCount * 2 - left.masteredCount;
    const rightScore = right.backlogCount * 3 + right.dueCount * 2 - right.masteredCount;
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
    return right.totalCount - left.totalCount;
  });

  const review = problems.reduce(
    (acc, problem) => {
      const record = normalizedProgress[String(problem.id)] ?? emptyRecord();
      if (record.workflowState !== "done" || !record.nextReviewDate) {
        return acc;
      }
      const delta = diffDays(today, record.nextReviewDate);
      if (delta <= 0) {
        acc.dueNowIds.push(problem.id);
      } else if (record.learningState === "mastered") {
        acc.masteredIds.push(problem.id);
      } else {
        acc.upcomingIds.push(problem.id);
      }
      return acc;
    },
    {
      dueNowIds: [] as number[],
      upcomingIds: [] as number[],
      masteredIds: [] as number[],
    },
  );

  const completionRate = problems.length === 0
    ? 0
    : Math.round((problems.filter((problem) => normalizedProgress[String(problem.id)]?.workflowState === "done").length / problems.length) * 100);
  const completionStats = buildCompletionHistory({
    problems,
    progress: normalizedProgress,
    today,
    deadline: effectiveDeadline,
  });
  const todaySuggestedNewCount = planDays[0]?.suggestedNewCount ?? 0;
  const remainingFreshCount = Math.max(0, todaySuggestedNewCount - completedTodayIds.length);
  const solvedProblemCount = problems.filter((problem) => normalizedProgress[String(problem.id)]?.workflowState === "done").length;
  const dueReviewIdsByDate = new Map(
    planDays.map((day) => [
      day.date,
      dueReviewIds.filter((problemId) => {
        const record = normalizedProgress[String(problemId)] ?? emptyRecord();
        return record.nextReviewDate === day.date;
      }),
    ]),
  );
  const paths = buildPathWorkspace({
    problems,
    progress: normalizedProgress,
    today,
  });

  return {
    dashboard: {
      dueReviewIds,
      overdueReviewIds,
      todayNewProblemIds,
      activeProblemIds,
      completedTodayIds,
      dueReviewCount: dueReviewIds.length,
      todayNewCount: todayNewProblemIds.length,
      overdueCount: overdueReviewIds.length,
    },
    plan: {
      deadline: {
        date: effectiveDeadline,
        totalProblemCount: problems.length,
        solvedProblemCount,
        remainingProblemCount: problems.filter((problem) => normalizedProgress[String(problem.id)]?.workflowState !== "done").length,
        totalDays: planDays.length,
      },
      days: planDays.map((day) => ({
        date: day.date,
        label: `${weekdayLabel(day.date)} ${formatMonthDay(day.date)}`,
        isToday: day.date === today,
        problemIds: day.problemIds,
        dueReviewIds: dueReviewIdsByDate.get(day.date) ?? [],
        suggestedNewCount: day.suggestedNewCount,
        reviewLoadCount: (dueReviewIdsByDate.get(day.date) ?? []).length,
        totalLoadCount: day.problemIds.length + (dueReviewIdsByDate.get(day.date) ?? []).length,
        remainingProblemCount: day.remainingProblemCount,
        capacity: day.suggestedNewCount,
      })),
    },
    review,
    reminders: {
      dueReviewCount: dueReviewIds.length,
      overdueReviewCount: overdueReviewIds.length,
      todayFreshCount: todayNewProblemIds.length,
      todayTarget: todaySuggestedNewCount,
      remainingFreshCount,
      shouldHighlightReviews: dueReviewIds.length > 0,
      shouldHighlightFreshTarget: remainingFreshCount > 0,
    },
    insights: {
      completionRate,
      totalCompletedCount: completionStats.totalCompletedCount,
      duePressure: dueReviewIds.length,
      completionHistory: completionStats.completionHistory,
      topicHealth,
    },
    paths,
    problemRows: problems.map((problem) => {
      const record = normalizedProgress[String(problem.id)] ?? emptyRecord();
      const isDue = record.workflowState === "done" && !!record.nextReviewDate && record.nextReviewDate <= today;
      const isInReviewQueue = record.workflowState === "done" && !!record.nextReviewDate;
      const earliestCompletedDate = firstCompletedDate(record);

      return {
        problem,
        record,
        statusLabel: statusLabel(record, today),
        nextAction: isInReviewQueue ? "review" : record.workflowState === "done" ? "open" : "solve",
        isDue,
        isInReviewQueue,
        firstCompletedDate: earliestCompletedDate,
        firstCompletedLabel: `First solved ${earliestCompletedDate ?? "Not yet"}`,
        scheduledLabel: record.scheduledDate ? `${weekdayLabel(record.scheduledDate)} ${formatMonthDay(record.scheduledDate)}` : null,
        reviewLabel: reviewLabel(record, today),
      };
    }),
  };
}
