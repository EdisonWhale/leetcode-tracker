"use client";

import type { Problem } from "@/data/problems";
import type { StudyWorkspace } from "@/lib/study";

type InsightsViewProps = {
  problemById: Record<number, Problem>;
  workspace: StudyWorkspace;
};

export function InsightsView({ problemById, workspace }: InsightsViewProps) {
  const nextDays = workspace.plan.days.slice(0, 5);
  const rowById = Object.fromEntries(workspace.problemRows.map((row) => [row.problem.id, row]));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <SignalCard label="Completion rate" value={`${workspace.insights.completionRate}%`} detail="Solved problems that now have memory state." />
        <SignalCard label="Due pressure" value={workspace.insights.duePressure} detail="Due and overdue reviews pulling attention forward." />
        <SignalCard label="Today queued" value={workspace.dashboard.todayNewCount} detail="Fresh items staged for current-day work." />
        <SignalCard label="Review now" value={workspace.review.dueNowIds.length} detail="Problems that should be recalled immediately." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Topic pressure</div>
          <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-none text-[var(--ink)]">
            Backlog and recall debt by topic.
          </h3>
          <div className="mt-6 space-y-4">
            {workspace.insights.topicHealth.slice(0, 10).map((topic) => {
              const score = topic.backlogCount * 3 + topic.dueCount * 2;
              const width = Math.min(100, (score / Math.max(topic.totalCount * 3, 1)) * 100);
              return (
                <div key={topic.topic} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-[var(--ink)]">{topic.topic}</div>
                      <div className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {topic.backlogCount} backlog · {topic.dueCount} due · {topic.masteredCount} mastered
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{topic.totalCount} total</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Near-term schedule</div>
            <div className="mt-5 space-y-3">
              {nextDays.map((day) => (
                <div key={day.date} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--ink)]">{day.label}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        {day.problemIds.length} new · {day.dueReviewIds.length} due reviews
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{day.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Due now details</div>
            <div className="mt-5 space-y-3">
              {workspace.review.dueNowIds.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
                  No immediate review debt.
                </div>
              ) : (
                workspace.review.dueNowIds.map((problemId) => {
                  const problem = problemById[problemId];
                  return (
                    <div key={problemId} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-4">
                      <div className="text-sm font-medium text-[var(--ink)]">
                        #{problem.id} {problem.title}
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{problem.cats.slice(0, 2).join(" · ")}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{rowById[problemId]?.firstCompletedLabel ?? "First solved Not yet"}</div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function SignalCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</div>
      <div className="mt-3 text-[2.15rem] font-semibold leading-none text-[var(--ink)]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </section>
  );
}
