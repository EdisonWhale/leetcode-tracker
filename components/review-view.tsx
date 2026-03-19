"use client";

import type { Problem } from "@/data/problems";
import type { Confidence, StudyWorkspace } from "@/lib/study";

type ReviewSessionState = {
  queue: number[];
  index: number;
};

type ReviewViewProps = {
  problemById: Record<number, Problem>;
  workspace: StudyWorkspace;
  session: ReviewSessionState | null;
  onStartSession: (problemIds?: number[]) => void;
  onEndSession: () => void;
  onOpenProblem: (problemId: number) => void;
  onRateCurrent: (confidence: Confidence) => Promise<void>;
  onSnoozeCurrent: () => Promise<void>;
};

const CONFIDENCE_CHOICES: Array<{ label: string; value: Confidence; detail: string; tone: string }> = [
  { label: "Again", value: 1, detail: "Memory fell apart. Reset it.", tone: "bg-[rgba(189,84,58,0.12)] text-[var(--clay)]" },
  { label: "Hard", value: 2, detail: "Needed hints or took too long.", tone: "bg-[rgba(188,150,62,0.14)] text-[color:#9c7a19]" },
  { label: "Good", value: 3, detail: "Solid recall with a few pauses.", tone: "bg-[rgba(74,125,86,0.14)] text-[var(--moss)]" },
  { label: "Easy", value: 4, detail: "Immediate recall, no friction.", tone: "bg-[rgba(72,96,189,0.14)] text-[var(--accent-strong)]" },
];

export function ReviewView({
  problemById,
  workspace,
  session,
  onStartSession,
  onEndSession,
  onOpenProblem,
  onRateCurrent,
  onSnoozeCurrent,
}: ReviewViewProps) {
  const currentId = session ? session.queue[session.index] : null;
  const currentProblem = currentId ? problemById[currentId] : null;
  const currentRow = currentId ? workspace.problemRows.find((row) => row.problem.id === currentId) : null;
  const firstCompletedLabelById = Object.fromEntries(workspace.problemRows.map((row) => [row.problem.id, row.firstCompletedLabel]));

  if (session && currentProblem && currentRow) {
    return (
      <div className="space-y-4">
        <section className="rounded-[34px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Focus review</div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2.1rem] leading-none text-[var(--ink)]">
                {session.index + 1} / {session.queue.length}
              </h3>
            </div>
            <button
              type="button"
              onClick={onEndSession}
              className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
            >
              End session
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[30px] border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  #{currentProblem.id}
                </span>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {currentProblem.diff}
                </span>
                <span className="rounded-full bg-[rgba(189,84,58,0.12)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--clay)]">
                  {currentRow.reviewLabel ?? "Due"}
                </span>
              </div>
              <h4 className="mt-4 font-[family-name:var(--font-display)] text-[2.4rem] leading-[1.02] text-[var(--ink)]">
                {currentProblem.title}
              </h4>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                Recall the pattern first. Open the original problem only after you have tried to reconstruct the approach.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {currentProblem.cats.map((cat) => (
                  <span key={cat} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-xs text-[var(--muted)]">
                    {cat}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{currentRow.firstCompletedLabel}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenProblem(currentProblem.id)}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Open notes
                </button>
                <a
                  href={currentProblem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
                >
                  Open LeetCode
                </a>
                <button
                  type="button"
                  onClick={onSnoozeCurrent}
                  className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
                >
                  Snooze
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[30px] border border-[var(--line)] bg-[var(--surface-2)] p-5">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Note snapshot</div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                  {currentRow.record.note || "No note saved yet. Use the side sheet if you want to capture the recall pattern after this rating."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Rate the recall</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {CONFIDENCE_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => onRateCurrent(choice.value)}
                className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-4 text-left transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
              >
                <div className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em] ${choice.tone}`}>{choice.label}</div>
                <div className="mt-4 text-sm leading-6 text-[var(--muted)]">{choice.detail}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">Review inbox</div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-none text-[var(--ink)]">
              Turn the queue into one continuous recall block.
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onStartSession()}
            disabled={workspace.review.dueNowIds.length === 0}
            className="rounded-full bg-[var(--clay)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Start due review
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <InboxList
          title="Due now"
          description="Urgent recall before the queue drifts."
          ids={workspace.review.dueNowIds}
          problemById={problemById}
          firstCompletedLabelById={firstCompletedLabelById}
          onOpenProblem={onOpenProblem}
          emptyText="Everything is caught up. No due reviews at the moment."
        />
        <InboxList
          title="Upcoming"
          description="Safe to leave until their review date."
          ids={workspace.review.upcomingIds}
          problemById={problemById}
          firstCompletedLabelById={firstCompletedLabelById}
          onOpenProblem={onOpenProblem}
          emptyText="No upcoming reviews in the near horizon."
        />
      </div>
    </div>
  );
}

function InboxList({
  title,
  description,
  ids,
  problemById,
  firstCompletedLabelById,
  onOpenProblem,
  emptyText,
}: {
  title: string;
  description: string;
  ids: number[];
  problemById: Record<number, Problem>;
  firstCompletedLabelById: Record<number, string>;
  onOpenProblem: (problemId: number) => void;
  emptyText: string;
}) {
  return (
    <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
      <div className="text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">{title}</div>
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.7rem] leading-none text-[var(--ink)]">{description}</h3>
      <div className="mt-5 space-y-3">
        {ids.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
            {emptyText}
          </div>
        ) : (
          ids.map((problemId) => {
            const problem = problemById[problemId];
            return (
              <button
                key={problemId}
                type="button"
                onClick={() => onOpenProblem(problemId)}
                className="flex w-full items-center justify-between rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--ink)]">
                    #{problem.id} {problem.title}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{problem.cats.slice(0, 2).join(" · ")}</div>
                  <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{firstCompletedLabelById[problemId] ?? "First solved Not yet"}</div>
                </div>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Open
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
