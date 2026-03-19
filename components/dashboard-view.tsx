"use client";

import Link from "next/link";

import type { Problem } from "@/data/problems";
import { formatMonthDay } from "@/lib/dates";
import type { StudyWorkspace } from "@/lib/study";

type DashboardViewProps = {
  problemById: Record<number, Problem>;
  workspace: StudyWorkspace;
  onOpenProblem: (problemId: number) => void;
  onOpenSolveRating: (problemId: number) => void;
  onOpenReviewRating: (problemId: number) => void;
  onStartSolve: (problem: Problem) => Promise<void>;
  onStartReviewSession: () => void;
};

export function DashboardView({
  problemById,
  workspace,
  onOpenProblem,
  onOpenSolveRating,
  onOpenReviewRating,
  onStartSolve,
  onStartReviewSession,
}: DashboardViewProps) {
  const dueProblems = workspace.dashboard.dueReviewIds.map((id) => problemById[id]).filter(Boolean);
  const todayProblems = workspace.dashboard.todayNewProblemIds.map((id) => problemById[id]).filter(Boolean);
  const activeProblems = workspace.dashboard.activeProblemIds.map((id) => problemById[id]).filter(Boolean);
  const weakTopics = workspace.insights.topicHealth.slice(0, 4);
  const completionHistory = workspace.insights.completionHistory;
  const rowById = Object.fromEntries(workspace.problemRows.map((row) => [row.problem.id, row]));
  const solvedTodayCount = workspace.dashboard.completedTodayIds.length;
  const todayTarget = workspace.reminders.todayTarget;
  const completedTodayProblems = workspace.dashboard.completedTodayIds.map((id) => problemById[id]).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Focus queue</div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.85rem] font-semibold leading-tight text-[var(--ink)]">
                Start with the highest-friction memory work.
              </h3>
            </div>
            <button
              type="button"
              onClick={onStartReviewSession}
              className="rounded-full bg-[var(--clay)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Start review session
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ActionCard
              eyebrow="Due now"
              value={workspace.dashboard.dueReviewCount}
              detail={workspace.dashboard.overdueCount > 0 ? `${workspace.dashboard.overdueCount} overdue` : "No overdue debt right now"}
              tone="clay"
            />
            <ActionCard
              eyebrow="Fresh problems"
              value={workspace.dashboard.todayNewCount}
              detail={
                workspace.reminders.remainingFreshCount > 0
                  ? `${workspace.dashboard.todayNewCount}/${workspace.reminders.todayTarget} queued · ${workspace.reminders.remainingFreshCount} still suggested`
                  : `Today's suggested new-problem load is staged`
              }
              tone="accent"
            />
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Daily progress</div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.55rem] font-semibold leading-tight text-[var(--ink)]">
                Let the daily suggestion move as the deadline gets closer.
              </h3>
            </div>
            <Link
              href="/plan"
              className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
            >
              Open deadline board
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricStrip label="Solved today" value={`${solvedTodayCount}/${todayTarget}`} />
            <MetricStrip label="Total solved" value={workspace.insights.totalCompletedCount} />
            <MetricStrip label="Active solves" value={activeProblems.length} />
            <MetricStrip label="Completion rate" value={`${workspace.insights.completionRate}%`} />
          </div>

          <div className="mt-5">
            <CompletionHeatmap
              weeks={completionHistory.weeks}
              maxDailyCount={completionHistory.maxDailyCount}
              windowStart={completionHistory.windowStart}
              windowEnd={completionHistory.windowEnd}
              totalDays={completionHistory.totalDays}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <SectionHeader
            eyebrow="Due reviews"
            title="Recall before opening solutions."
            detail={dueProblems.length > 0 ? `${dueProblems.length} problems need a memory check.` : "Nothing due right now."}
          />
          <div className="mt-5 space-y-3">
            {dueProblems.length === 0 ? (
              <EmptyCard text="Review pressure is clear. Use the weekly board to stage the next fresh problems." />
            ) : (
              dueProblems.slice(0, 5).map((problem) => (
                <CompactProblemCard
                  key={problem.id}
                  problem={problem}
                  kicker="Review due"
                  meta={problem.cats.slice(0, 2).join(" · ")}
                  firstCompletedLabel={rowById[problem.id]?.firstCompletedLabel ?? "First solved Not yet"}
                  primaryLabel="Log review"
                  onPrimary={() => onOpenReviewRating(problem.id)}
                  onSecondary={() => onOpenProblem(problem.id)}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <SectionHeader
            eyebrow="Today's fresh problems"
            title="Solve from a staged queue, not from the entire library."
            detail={`${todayProblems.length} problems queued for today. Suggested new count: ${workspace.reminders.todayTarget}.`}
          />
          <div className="mt-5 space-y-3">
            {todayProblems.length === 0 ? (
              <EmptyCard text="Today's fresh queue is empty. Raise your target or move items in from the Plan page." />
            ) : (
              todayProblems.slice(0, 5).map((problem) => (
                <CompactProblemCard
                  key={problem.id}
                  problem={problem}
                  kicker="Fresh solve"
                  meta={problem.cats.slice(0, 2).join(" · ")}
                  firstCompletedLabel={rowById[problem.id]?.firstCompletedLabel ?? "First solved Not yet"}
                  primaryLabel="Start solve"
                  onPrimary={() => onStartSolve(problem)}
                  onSecondary={() => onOpenSolveRating(problem.id)}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section id="today-completed" className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <SectionHeader
          eyebrow="Today's completed"
          title={`You've finished ${solvedTodayCount}/${todayTarget} today.`}
          detail={solvedTodayCount > todayTarget ? `Ahead of today's suggested count by ${solvedTodayCount - todayTarget}.` : `${Math.max(todayTarget - solvedTodayCount, 0)} left to meet today's suggestion.`}
        />
        <div className="mt-5 space-y-3">
          {completedTodayProblems.length === 0 ? (
            <EmptyCard text="Nothing completed yet today. The first solved problem will appear here so you can review what you got through." />
          ) : (
            completedTodayProblems.map((problem) => (
              <div key={problem.id} className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Solved today</div>
                    <div className="mt-2 text-base font-medium text-[var(--ink)]">
                      #{problem.id} {problem.title}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{problem.cats.slice(0, 3).join(" · ")}</div>
                  </div>
                  <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {problem.diff}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProblem(problem.id)}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Open details
                  </button>
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
                  >
                    Open LeetCode
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <SectionHeader
            eyebrow="Weak topics"
            title="The board should lean into pressure, not away from it."
            detail="Topics with high backlog and due load float to the top."
          />
          <div className="mt-5 space-y-3">
            {weakTopics.map((topic) => (
              <div key={topic.topic} className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--ink)]">{topic.topic}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {topic.backlogCount} backlog · {topic.dueCount} due · {topic.masteredCount} mastered
                    </div>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{topic.totalCount} total</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-1)]">
                  <div
                    className="h-full rounded-full bg-[var(--clay)]"
                    style={{ width: `${Math.min(100, (topic.backlogCount / Math.max(topic.totalCount, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <SectionHeader
            eyebrow="Continue solving"
            title="Keep unfinished work visible."
            detail={activeProblems.length > 0 ? "Problems already opened stay one tap away." : "No active solves at the moment."}
          />
          <div className="mt-5 space-y-3">
            {activeProblems.length === 0 ? (
              <EmptyCard text="When you start a problem it will show up here until you mark it solved." />
            ) : (
              activeProblems.map((problem) => (
                <CompactProblemCard
                  key={problem.id}
                  problem={problem}
                  kicker="In progress"
                  meta={problem.cats.slice(0, 2).join(" · ")}
                  firstCompletedLabel={rowById[problem.id]?.firstCompletedLabel ?? "First solved Not yet"}
                  primaryLabel="Mark solved"
                  onPrimary={() => onOpenSolveRating(problem.id)}
                  onSecondary={() => onOpenProblem(problem.id)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">{eyebrow}</div>
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold leading-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function ActionCard({
  eyebrow,
  value,
  detail,
  tone,
}: {
  eyebrow: string;
  value: number;
  detail: string;
  tone: "clay" | "accent";
}) {
  return (
    <div
      className={`rounded-[28px] border p-4 ${
        tone === "clay"
          ? "border-[rgba(239,71,67,0.24)] bg-[rgba(239,71,67,0.08)]"
          : "border-[rgba(255,161,22,0.22)] bg-[rgba(255,161,22,0.08)]"
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{eyebrow}</div>
      <div className="mt-3 text-[2.3rem] font-semibold leading-none text-[var(--ink)]">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</div>
    </div>
  );
}

function MetricStrip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-lg font-semibold text-[var(--ink)]">{value}</span>
    </div>
  );
}

function CompactProblemCard({
  problem,
  kicker,
  meta,
  firstCompletedLabel,
  primaryLabel,
  onPrimary,
  onSecondary,
}: {
  problem: Problem;
  kicker: string;
  meta: string;
  firstCompletedLabel: string;
  primaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{kicker}</div>
          <div className="mt-2 text-base font-medium text-[var(--ink)]">
            #{problem.id} {problem.title}
          </div>
          <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{meta}</div>
          <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{firstCompletedLabel}</div>
        </div>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          {problem.diff}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
        >
          Open details
        </button>
      </div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
      {text}
    </div>
  );
}

function CompletionHeatmap({
  weeks,
  maxDailyCount,
  windowStart,
  windowEnd,
  totalDays,
}: {
  weeks: StudyWorkspace["insights"]["completionHistory"]["weeks"];
  maxDailyCount: number;
  windowStart: string;
  windowEnd: string;
  totalDays: number;
}) {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-1)] p-4">
      <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
        <div className="mt-6 grid grid-rows-7 gap-2">
          {weekdays.map((day) => (
            <div key={day} className="flex h-3 items-center text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              {day}
            </div>
          ))}
        </div>

        <div className="min-w-0 overflow-x-auto pb-1">
          <div className="inline-flex min-w-full flex-col gap-2">
            <div className="flex gap-2 px-[1px]">
              {weeks.map((week) => (
                <div key={week.weekStart} className="flex w-3 justify-center text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {week.monthLabel ?? ""}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {weeks.map((week, weekIndex) => (
                <div key={week.weekStart} className="grid grid-rows-7 gap-2">
                  {week.days.map((day, dayIndex) => (
                    <div
                      key={day.date ?? `${week.weekStart}-placeholder-${weekIndex}-${dayIndex}`}
                      title={day.isPlaceholder ? "Outside current plan window" : `${day.date} · ${day.count} solved`}
                      className={`h-3 w-3 rounded-[4px] border ${
                        day.isPlaceholder
                          ? "border-transparent bg-transparent opacity-0"
                          : day.isFuture
                          ? "border-[var(--line)] bg-transparent opacity-35"
                          : day.level === 4
                            ? "border-[rgba(255,161,22,0.7)] bg-[var(--accent)]"
                            : day.level === 3
                              ? "border-[rgba(255,161,22,0.5)] bg-[rgba(255,161,22,0.7)]"
                              : day.level === 2
                                ? "border-[rgba(255,161,22,0.32)] bg-[rgba(255,161,22,0.4)]"
                                : day.level === 1
                                  ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.12)]"
                                  : "border-[var(--line)] bg-[var(--surface-1)]"
                      } ${day.isToday ? "ring-1 ring-[var(--accent-strong)] ring-offset-1 ring-offset-[var(--panel)]" : ""}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <span>
          Sprint window {formatMonthDay(windowStart)} to {formatMonthDay(windowEnd)} · {totalDays} days
        </span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`h-3 w-3 rounded-[4px] border ${
                level === 4
                  ? "border-[rgba(255,161,22,0.7)] bg-[var(--accent)]"
                  : level === 3
                    ? "border-[rgba(255,161,22,0.5)] bg-[rgba(255,161,22,0.7)]"
                    : level === 2
                      ? "border-[rgba(255,161,22,0.32)] bg-[rgba(255,161,22,0.4)]"
                      : level === 1
                        ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.12)]"
                        : "border-[var(--line)] bg-[var(--surface-1)]"
              }`}
            />
          ))}
          <span>More {maxDailyCount > 0 ? `(${maxDailyCount}/day max)` : ""}</span>
        </div>
      </div>
    </div>
  );
}
