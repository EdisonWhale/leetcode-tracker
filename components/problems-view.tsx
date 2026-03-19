"use client";

import { useDeferredValue, useState } from "react";

import type { Problem } from "@/data/problems";
import { CATEGORIES } from "@/data/problems";
import type { StudyWorkspace } from "@/lib/study";

type ProblemsViewProps = {
  problemById: Record<number, Problem>;
  workspace: StudyWorkspace;
  onOpenProblem: (problemId: number) => void;
  onOpenSolveRating: (problemId: number) => void;
  onOpenReviewRating: (problemId: number) => void;
  onStartSolve: (problem: Problem) => Promise<unknown>;
  onSchedule: (problemId: number, date: string | null) => Promise<unknown>;
  onSnooze: (problemId: number) => Promise<unknown>;
};

type FilterValue = "all" | "due" | "today" | "active" | "done" | "backlog";
type DifficultyValue = "All" | "Easy" | "Medium" | "Hard";
type SortValue = "recommended" | "title" | "difficulty" | "id";

const DIFFICULTY_ORDER: Record<DifficultyValue, number> = {
  All: -1,
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

export function ProblemsView({
  problemById,
  workspace,
  onOpenProblem,
  onOpenSolveRating,
  onOpenReviewRating,
  onStartSolve,
  onSchedule,
  onSnooze,
}: ProblemsViewProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState<DifficultyValue>("All");
  const [sortBy, setSortBy] = useState<SortValue>("recommended");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const rows = workspace.problemRows
    .filter((row) => {
      if (filter === "due") return row.isInReviewQueue;
      if (filter === "today") return workspace.dashboard.todayNewProblemIds.includes(row.problem.id);
      if (filter === "active") return row.record.workflowState === "active";
      if (filter === "done") return row.record.workflowState === "done";
      if (filter === "backlog") return row.record.workflowState !== "done" && row.record.workflowState !== "active";
      return true;
    })
    .filter((row) => (category === "All" ? true : row.problem.cats.includes(category)))
    .filter((row) => (difficulty === "All" ? true : row.problem.diff === difficulty))
    .filter((row) => {
      if (!deferredQuery.trim()) return true;
      const lowerQuery = deferredQuery.toLowerCase();
      return (
        row.problem.title.toLowerCase().includes(lowerQuery) ||
        String(row.problem.id).includes(lowerQuery) ||
        row.problem.cats.some((cat) => cat.toLowerCase().includes(lowerQuery))
      );
    })
    .sort((left, right) => {
      if (sortBy === "title") return left.problem.title.localeCompare(right.problem.title);
      if (sortBy === "difficulty") {
        return DIFFICULTY_ORDER[left.problem.diff] - DIFFICULTY_ORDER[right.problem.diff] || left.problem.id - right.problem.id;
      }
      if (sortBy === "id") return left.problem.id - right.problem.id;
      if (left.isDue !== right.isDue) return left.isDue ? -1 : 1;
      if (left.record.workflowState !== right.record.workflowState) {
        if (left.record.workflowState === "active") return -1;
        if (right.record.workflowState === "active") return 1;
      }
      return left.problem.id - right.problem.id;
    });

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Problem set</div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.7rem] font-semibold leading-tight text-[var(--ink)]">
              Filter it like LeetCode.
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Question list, fast filters, compact actions, no notebook styling.</p>
          </div>
          <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Visible rows</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">{rows.length}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["due", "To Review"],
            ["today", "Today's Plan"],
            ["active", "Solving"],
            ["done", "Solved"],
            ["backlog", "Backlog"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`inline-flex h-11 items-center rounded-[14px] border px-5 text-sm font-medium transition-colors ${
                filter === value
                  ? "border-[rgba(255,161,22,0.38)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--line)] bg-[var(--surface-1)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_210px_260px_210px]">
          <input
            type="text"
            placeholder="Search questions, topics, or problem #"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface-1)] px-5 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
          <FilterSelect value={difficulty} onChange={(value) => setDifficulty(value as DifficultyValue)}>
            <option value="All">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </FilterSelect>
          <FilterSelect value={category} onChange={setCategory}>
            <option value="All">All Topics</option>
            {CATEGORIES.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={sortBy} onChange={(value) => setSortBy(value as SortValue)}>
            <option value="recommended">Recommended</option>
            <option value="title">Title</option>
            <option value="difficulty">Difficulty</option>
            <option value="id">Problem #</option>
          </FilterSelect>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-[28px_minmax(0,1fr)_240px] items-center gap-4 border-b border-[var(--line)] bg-[var(--panel-strong)] px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          <span />
          <span>Question</span>
          <span className="hidden md:block">Actions</span>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {rows.map((row) => {
            const problem = problemById[row.problem.id];
            const difficultyClass =
              problem.diff === "Easy"
                ? "text-[var(--moss)]"
                : problem.diff === "Medium"
                  ? "text-[var(--accent)]"
                  : "text-[var(--clay)]";

            return (
              <div
                key={problem.id}
                className="grid grid-cols-[28px_minmax(0,1fr)] gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-1)] md:grid-cols-[28px_minmax(0,1fr)_240px]"
              >
                <div className="flex items-start pt-1">
                  <span
                    className={`mt-1 h-3 w-3 rounded-full ${
                      row.isDue
                        ? "bg-[var(--clay)]"
                        : row.record.workflowState === "done"
                          ? "bg-[var(--moss)]"
                          : row.record.workflowState === "active"
                            ? "bg-[var(--accent)]"
                            : "bg-[var(--surface-4)]"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenProblem(problem.id)}
                      className="truncate text-left text-[15px] font-medium text-[var(--ink)] transition-colors hover:text-[var(--accent-strong)]"
                    >
                      {problem.id}. {problem.title}
                    </button>
                    {row.isDue && <Badge label="Due" tone="danger" />}
                    {!row.isDue && row.isInReviewQueue && <Badge label="Queued" tone="accent" />}
                    {row.record.workflowState === "active" && <Badge label="Solving" tone="accent" />}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                    <span className={difficultyClass}>{problem.diff}</span>
                    <span>{problem.cats.slice(0, 3).join(" / ")}</span>
                    <span>{row.reviewLabel ? `Review ${row.reviewLabel}` : row.scheduledLabel ? `Plan ${row.scheduledLabel}` : "No schedule"}</span>
                    {row.record.note && <span className="text-[var(--blue)]">Has notes</span>}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{row.firstCompletedLabel}</div>

                  <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                    <RowActions
                      row={row}
                      problem={problem}
                      fallbackDate={workspace.plan.days[0]?.date ?? null}
                      onOpenProblem={onOpenProblem}
                      onOpenReviewRating={onOpenReviewRating}
                      onOpenSolveRating={onOpenSolveRating}
                      onSchedule={onSchedule}
                      onSnooze={onSnooze}
                      onStartSolve={onStartSolve}
                    />
                  </div>
                </div>

                <div className="hidden items-center justify-end gap-2 md:flex">
                  <RowActions
                    row={row}
                    problem={problem}
                    fallbackDate={workspace.plan.days[0]?.date ?? null}
                    onOpenProblem={onOpenProblem}
                    onOpenReviewRating={onOpenReviewRating}
                    onOpenSolveRating={onOpenSolveRating}
                    onSchedule={onSchedule}
                    onSnooze={onSnooze}
                    onStartSolve={onStartSolve}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "danger" | "accent" }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        tone === "danger" ? "bg-[rgba(239,71,67,0.14)] text-[var(--clay)]" : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      }`}
    >
      {label}
    </span>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-[14px] border border-[var(--line)] bg-[var(--surface-1)] px-5 pr-12 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--muted)]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3.5 5.25 7 8.75l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

function RowActions({
  row,
  problem,
  fallbackDate,
  onOpenProblem,
  onOpenReviewRating,
  onOpenSolveRating,
  onSchedule,
  onSnooze,
  onStartSolve,
}: {
  row: StudyWorkspace["problemRows"][number];
  problem: Problem;
  fallbackDate: string | null;
  onOpenProblem: (problemId: number) => void;
  onOpenSolveRating: (problemId: number) => void;
  onOpenReviewRating: (problemId: number) => void;
  onStartSolve: (problem: Problem) => Promise<unknown>;
  onSchedule: (problemId: number, date: string | null) => Promise<unknown>;
  onSnooze: (problemId: number) => Promise<unknown>;
}) {
  const subtleClass =
    "rounded-md border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]";

  return (
    <>
      {row.record.workflowState === "active" ? (
        <button
          type="button"
          onClick={() => onOpenSolveRating(problem.id)}
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#121212] transition-opacity hover:opacity-90"
        >
          Complete
        </button>
      ) : row.isInReviewQueue ? (
        <>
          <button
            type="button"
            onClick={() => onOpenReviewRating(problem.id)}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90 ${
              row.isDue ? "bg-[var(--clay)] text-white" : "bg-[var(--accent)] text-[#121212]"
            }`}
          >
            Review
          </button>
          {row.isDue && (
            <button type="button" onClick={() => onSnooze(problem.id)} className={subtleClass}>
              Snooze
            </button>
          )}
        </>
      ) : row.record.workflowState === "done" ? (
        <a href={problem.url} target="_blank" rel="noreferrer" className={subtleClass}>
          Open
        </a>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onStartSolve(problem)}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#121212] transition-opacity hover:opacity-90"
          >
            Start
          </button>
          <button type="button" onClick={() => onSchedule(problem.id, fallbackDate)} className={subtleClass}>
            Plan
          </button>
        </>
      )}

      <button type="button" onClick={() => onOpenProblem(problem.id)} className={subtleClass}>
        Details
      </button>
    </>
  );
}
