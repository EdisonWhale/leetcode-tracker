"use client";

import type { Problem } from "@/data/problems";
import type { StudyWorkspace } from "@/lib/study";

type PlanViewProps = {
  problemById: Record<number, Problem>;
  workspace: StudyWorkspace;
  onOpenProblem: (problemId: number) => void;
  onSchedule: (problemId: number, date: string | null) => Promise<unknown>;
};

export function PlanView({ problemById, workspace, onOpenProblem, onSchedule }: PlanViewProps) {
  const plannedIds = new Set(workspace.plan.days.flatMap((day) => day.problemIds));
  const backlogRows = workspace.problemRows.filter((row) => row.record.workflowState !== "done" && !plannedIds.has(row.problem.id));
  const rowById = Object.fromEntries(workspace.problemRows.map((row) => [row.problem.id, row]));

  return (
    <div className="space-y-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Deadline board</div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-none text-[var(--ink)]">
              Finish the fixed pool by the cutoff, then let the daily load rebalance.
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
            <div className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2">
              Deadline {workspace.plan.deadline.date}
            </div>
            <div className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2">
              {workspace.plan.deadline.remainingProblemCount} unsolved left
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
        {workspace.plan.days.map((day, index) => (
          <section key={day.date} className="rounded-[30px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">{day.isToday ? "Today" : "Plan day"}</div>
                <div className="mt-2 font-[family-name:var(--font-display)] text-[1.65rem] leading-none text-[var(--ink)]">{day.label}</div>
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {day.totalLoadCount} total load
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Suggested split</div>
              <div className="mt-2 text-sm text-[var(--ink)]">
                {day.suggestedNewCount} new + {day.reviewLoadCount} review{day.reviewLoadCount === 1 ? "" : "s"}
              </div>
            </div>

            {day.dueReviewIds.length > 0 && (
              <div className="mt-4 rounded-[22px] border border-[rgba(189,84,58,0.18)] bg-[rgba(189,84,58,0.08)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Due reviews</div>
                <div className="mt-2 text-sm text-[var(--ink)]">{day.dueReviewIds.length} reviews land on this day.</div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {day.problemIds.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-4 text-sm text-[var(--muted)]">
                  No fresh problems staged here yet.
                </div>
              ) : (
                day.problemIds.map((problemId) => {
                  const problem = problemById[problemId];
                  return (
                    <div key={problemId} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">New problem</div>
                      <div className="mt-2 text-sm font-medium text-[var(--ink)]">
                        #{problem.id} {problem.title}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{problem.cats.slice(0, 2).join(" · ")}</div>
                      <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{rowById[problem.id]?.firstCompletedLabel ?? "First solved Not yet"}</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenProblem(problem.id)}
                          className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                        >
                          Open
                        </button>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => onSchedule(problem.id, workspace.plan.days[index - 1].date)}
                            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
                          >
                            Earlier
                          </button>
                        )}
                        {index < workspace.plan.days.length - 1 && (
                          <button
                            type="button"
                            onClick={() => onSchedule(problem.id, workspace.plan.days[index + 1].date)}
                            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
                          >
                            Later
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Overflow backlog</div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.9rem] leading-none text-[var(--ink)]">
              Problems that still sit outside the current deadline window.
            </h3>
          </div>
          <div className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--muted)]">
            {backlogRows.length} unscheduled beyond the current board
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {backlogRows.slice(0, 12).map((row) => (
            <div key={row.problem.id} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <div className="text-sm font-medium text-[var(--ink)]">
                #{row.problem.id} {row.problem.title}
              </div>
              <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{row.problem.cats.slice(0, 2).join(" · ")}</div>
              <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{row.firstCompletedLabel}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSchedule(row.problem.id, workspace.plan.days[0]?.date ?? null)}
                  className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  Bring into today
                </button>
                <button
                  type="button"
                  onClick={() => onOpenProblem(row.problem.id)}
                  className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
