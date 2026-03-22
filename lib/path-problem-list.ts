import type { Problem } from "@/data/problems";

export type PathProblemBucket = "core" | "additional";
export type PathProblemSourceFilter = "all" | "both" | "neetcode150" | "google tag";
export type PathProblemStatusFilter = "all" | "done" | "due" | "review" | "open";
export type PathProblemDifficultyFilter = "all" | Problem["diff"];
export type PathProblemBucketFilter = "all" | PathProblemBucket;
export type PathProblemSort = "roadmap" | "title" | "difficulty" | "status";

export type PathProblemListFilters = {
  query: string;
  difficulty: PathProblemDifficultyFilter;
  source: PathProblemSourceFilter;
  status: PathProblemStatusFilter;
  bucket: PathProblemBucketFilter;
};

export type PathProblemListItem = {
  problem: Problem;
  bucket: PathProblemBucket;
  isDone: boolean;
  isDue: boolean;
  isInReviewQueue: boolean;
};

const DIFFICULTY_ORDER: Record<Problem["diff"], number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

const STATUS_ORDER: Record<"due" | "review" | "open" | "done", number> = {
  due: 0,
  review: 1,
  open: 2,
  done: 3,
};

export function filterPathProblems(items: PathProblemListItem[], filters: PathProblemListFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.bucket !== "all" && item.bucket !== filters.bucket) {
      return false;
    }

    if (filters.difficulty !== "all" && item.problem.diff !== filters.difficulty) {
      return false;
    }

    if (filters.source === "both" && item.problem.sources.length !== 2) {
      return false;
    }

    if (filters.source !== "all" && filters.source !== "both" && !item.problem.sources.includes(filters.source)) {
      return false;
    }

    if (filters.status === "done" && !item.isDone) {
      return false;
    }

    if (filters.status === "due" && !item.isDue) {
      return false;
    }

    if (filters.status === "review" && !item.isInReviewQueue) {
      return false;
    }

    if (filters.status === "open" && (item.isDone || item.isInReviewQueue)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.problem.title,
      item.problem.diff,
      item.bucket,
      ...item.problem.cats,
      ...item.problem.sources,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortPathProblems(items: PathProblemListItem[], sort: PathProblemSort) {
  const nextItems = [...items];

  nextItems.sort((left, right) => {
    if (sort === "title") {
      return left.problem.title.localeCompare(right.problem.title);
    }

    if (sort === "difficulty") {
      return DIFFICULTY_ORDER[left.problem.diff] - DIFFICULTY_ORDER[right.problem.diff];
    }

    if (sort === "status") {
      return getStatusRank(left) - getStatusRank(right);
    }

    return 0;
  });

  return nextItems;
}

function getStatusRank(item: PathProblemListItem) {
  if (item.isDue) {
    return STATUS_ORDER.due;
  }
  if (item.isInReviewQueue) {
    return STATUS_ORDER.review;
  }
  if (item.isDone) {
    return STATUS_ORDER.done;
  }
  return STATUS_ORDER.open;
}
