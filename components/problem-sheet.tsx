"use client";

import { useEffect, useState } from "react";

import type { Problem } from "@/data/problems";
import type { StudyProgressRecord } from "@/lib/study";

type ProblemSheetProps = {
  problem: Problem | null;
  record: StudyProgressRecord | null;
  today: string;
  onClose: () => void;
  onSaveNote: (note: string) => Promise<unknown>;
  onSchedule: (date: string | null) => Promise<unknown>;
  onOpenRating: (mode: "solve" | "review") => void;
  onStartSolve: () => Promise<unknown>;
  onSnooze: () => Promise<unknown>;
};

export function ProblemSheet({
  problem,
  record,
  today,
  onClose,
  onSaveNote,
  onSchedule,
  onOpenRating,
  onStartSolve,
  onSnooze,
}: ProblemSheetProps) {
  const [note, setNote] = useState(record?.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(record?.note ?? "");
  }, [record?.note, problem?.id]);

  if (!problem || !record) {
    return null;
  }

  const isDone = record.workflowState === "done";
  const isDue = isDone && !!record.nextReviewDate && record.nextReviewDate <= today;
  const isInReviewQueue = isDone && !!record.nextReviewDate;
  const scheduleChips = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: offsetDate(today, 1) },
    { label: "This Weekend", value: offsetDate(today, 3) },
  ];

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveNote(note);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(29,22,16,0.32)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--line)] bg-[var(--panel-strong)] px-6 py-6 shadow-[var(--shadow-soft)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Problem detail</p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2.2rem] leading-[1.02] text-[var(--ink)]">
              {problem.title}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>{problem.diff}</Tag>
              {problem.cats.slice(0, 3).map((cat) => (
                <Tag key={cat}>{cat}</Tag>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <Panel label="Workflow" value={record.workflowState} />
          <Panel label="Learning" value={record.learningState} />
          <Panel label="Next review" value={record.nextReviewDate ?? "Not scheduled"} />
        </div>
        <div className="mt-3 text-sm text-[var(--muted)]">First solved {record.sessions.find((session) => session.kind === "solve")?.date ?? record.completedDate ?? "Not yet"}</div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Next action</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {!isDone && (
                  <button
                    type="button"
                    onClick={onStartSolve}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Start solve
                  </button>
                )}
                {record.workflowState !== "done" && (
                  <button
                    type="button"
                    onClick={() => onOpenRating("solve")}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
                  >
                    Mark solved
                  </button>
                )}
                {isInReviewQueue && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenRating("review")}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${
                        isDue ? "bg-[var(--clay)] text-white" : "bg-[var(--accent)] text-white"
                      }`}
                    >
                      {isDue ? "Log review" : "Review now"}
                    </button>
                    {isDue && (
                      <button
                        type="button"
                        onClick={onSnooze}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
                      >
                        Snooze
                      </button>
                    )}
                  </>
                )}
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)]"
                >
                  Open LeetCode
                </a>
              </div>
              {isInReviewQueue && !isDue && (
                <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                  This problem is already in the review queue. Next scheduled review: {record.nextReviewDate}.
                </p>
              )}
            </section>

            <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Recall notes</div>
                  <div className="mt-2 text-sm text-[var(--muted)]">Keep pattern, edge cases, and personal mistakes structured.</div>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save note"}
                </button>
              </div>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={14}
                placeholder={"Pattern:\n\nWhat I missed:\n\nKey invariant:\n\nEdge cases:\n\nWhat to recall next time:"}
                className="mt-4 w-full rounded-[24px] border border-[var(--line)] bg-[var(--panel)] px-4 py-4 font-mono text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              />
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Plan placement</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {scheduleChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => onSchedule(chip.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      record.scheduledDate === chip.value
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                        : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onSchedule(null)}
                  className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)]"
                >
                  Clear slot
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Session history</div>
              <div className="mt-4 space-y-3">
                {record.sessions.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No solve or review sessions logged yet.</p>
                ) : (
                  record.sessions.slice(-6).reverse().map((session, index) => (
                    <div key={`${session.date}-${index}`} className="rounded-[20px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-[var(--ink)]">{session.kind}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{session.date}</span>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
                        Confidence {session.confidence ?? "—"} · next review {session.nextReviewDate ?? "not scheduled"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
      {children}
    </span>
  );
}

function Panel({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-medium text-[var(--ink)]">{value ?? "—"}</div>
    </div>
  );
}

function offsetDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
