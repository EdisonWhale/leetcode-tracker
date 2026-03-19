"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { problems, type Problem } from "@/data/problems";
import { getLocalDate } from "@/lib/dates";
import {
  buildStudyWorkspace,
  DEFAULT_SETTINGS,
  reduceProgressAction,
  type Confidence,
  type ProgressAction,
  type StudyProgressRecord,
  type StudyWorkspace as StudyWorkspaceData,
  type StudySettings,
} from "@/lib/study";

import { DashboardView } from "@/components/dashboard-view";
import { InsightsView } from "@/components/insights-view";
import { PlanView } from "@/components/plan-view";
import { ProblemSheet } from "@/components/problem-sheet";
import { ProblemsView } from "@/components/problems-view";
import { ReviewView } from "@/components/review-view";
import { SettingsPanel } from "@/components/settings-panel";
import { WorkspaceShell, type WorkspacePage } from "@/components/workspace-shell";

type RatingTarget = {
  problemId: number;
  mode: "solve" | "review";
};

type ReviewSessionState = {
  queue: number[];
  index: number;
};

type StudyWorkspaceProps = {
  page: WorkspacePage;
};

type NotificationState = NotificationPermission | "unsupported";

export function StudyWorkspace({ page }: StudyWorkspaceProps) {
  const [today] = useState(() => getLocalDate());
  const [progress, setProgress] = useState<Record<string, StudyProgressRecord>>({});
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [ratingTarget, setRatingTarget] = useState<RatingTarget | null>(null);
  const [reviewSession, setReviewSession] = useState<ReviewSessionState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationState>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return window.Notification.permission;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      const [progressResponse, settingsResponse] = await Promise.all([
        fetch("/api/progress"),
        fetch("/api/settings"),
      ]);

      const [progressPayload, settingsPayload] = await Promise.all([
        progressResponse.json(),
        settingsResponse.json(),
      ]);

      if (cancelled) {
        return;
      }

      setProgress(progressPayload);
      setSettings(settingsPayload);
      setLoading(false);
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  const workspace = buildStudyWorkspace({
    problems,
    progress,
    settings,
    today,
  });

  const problemById = Object.fromEntries(problems.map((problem) => [problem.id, problem])) as Record<number, Problem>;
  const selectedProblem = selectedProblemId ? problemById[selectedProblemId] : null;
  const selectedRecord = selectedProblemId
    ? workspace.problemRows.find((row) => row.problem.id === selectedProblemId)?.record ?? null
    : null;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(window.Notification.permission);
  }, []);

  useEffect(() => {
    const baseTitle = "LeetPlan OS";

    if (workspace.reminders.dueReviewCount > 0) {
      document.title = `${workspace.reminders.dueReviewCount} due · ${baseTitle}`;
      return;
    }

    if (workspace.reminders.remainingFreshCount > 0) {
      document.title = `${workspace.reminders.remainingFreshCount} left · ${baseTitle}`;
      return;
    }

    document.title = baseTitle;
  }, [workspace.reminders.dueReviewCount, workspace.reminders.remainingFreshCount]);

  useEffect(() => {
    if (
      typeof window === "undefined"
      || notificationPermission !== "granted"
      || workspace.reminders.dueReviewCount === 0
    ) {
      return;
    }

    const reminderKey = `study-reminder:${today}`;
    const signature = [
      workspace.reminders.dueReviewCount,
      workspace.reminders.overdueReviewCount,
      workspace.reminders.remainingFreshCount,
    ].join(":");

    if (window.localStorage.getItem(reminderKey) === signature) {
      return;
    }

    const notification = new window.Notification(buildReminderTitle(workspace.reminders), {
      body: buildReminderBody(workspace.reminders),
    });

    window.localStorage.setItem(reminderKey, signature);

    return () => notification.close();
  }, [
    notificationPermission,
    today,
    workspace.reminders,
    workspace.reminders.dueReviewCount,
    workspace.reminders.overdueReviewCount,
    workspace.reminders.remainingFreshCount,
  ]);

  async function runProblemAction(problemId: number, action: ProgressAction) {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: problemId, action }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to update problem progress.");
    }

    setProgress((current) => ({
      ...current,
      [String(problemId)]: payload.record,
    }));

    return payload.record as StudyProgressRecord;
  }

  async function saveSettings(nextSettings: StudySettings) {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings),
    });
    const payload = await response.json();
    setSettings(payload.settings);
  }

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  }

  async function startSolve(problem: Problem) {
    await runProblemAction(problem.id, { type: "start-solve" });
    window.open(problem.url, "_blank", "noopener,noreferrer");
  }

  function startReviewSession(problemIds = workspace.review.dueNowIds) {
    const queue = problemIds.slice(0, settings.reviewSessionSize);
    if (queue.length === 0) {
      return;
    }
    setReviewSession({ queue, index: 0 });
  }

  async function rateCurrentReview(confidence: Confidence) {
    if (!reviewSession) {
      return;
    }
    const currentProblemId = reviewSession.queue[reviewSession.index];
    await runProblemAction(currentProblemId, { type: "rate-review", confidence });

    setReviewSession((current) => {
      if (!current) {
        return current;
      }
      const nextIndex = current.index + 1;
      return nextIndex >= current.queue.length ? null : { ...current, index: nextIndex };
    });
  }

  async function snoozeCurrentReview() {
    if (!reviewSession) {
      return;
    }
    const currentProblemId = reviewSession.queue[reviewSession.index];
    await runProblemAction(currentProblemId, { type: "snooze-review" });

    setReviewSession((current) => {
      if (!current) {
        return current;
      }
      const nextIndex = current.index + 1;
      return nextIndex >= current.queue.length ? null : { ...current, index: nextIndex };
    });
  }

  async function submitRating(confidence: Confidence) {
    if (!ratingTarget) {
      return;
    }

    const action: ProgressAction =
      ratingTarget.mode === "solve"
        ? { type: "complete-solve", confidence }
        : { type: "rate-review", confidence };

    await runProblemAction(ratingTarget.problemId, action);
    setRatingTarget(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          Loading study workspace...
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceShell
        page={page}
        stats={{
          dueReviews: workspace.dashboard.dueReviewCount,
          todayProgress: `${workspace.dashboard.completedTodayIds.length}/${workspace.reminders.todayTarget}`,
          todayTarget: workspace.reminders.todayTarget,
          completionRate: workspace.insights.completionRate,
          overdueReviews: workspace.dashboard.overdueCount,
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <ReminderBanner
          page={page}
          reminders={workspace.reminders}
          notificationPermission={notificationPermission}
          onEnableNotifications={enableNotifications}
        />

        {page === "dashboard" && (
          <DashboardView
            problemById={problemById}
            workspace={workspace}
            onOpenProblem={setSelectedProblemId}
            onOpenSolveRating={(problemId) => setRatingTarget({ problemId, mode: "solve" })}
            onOpenReviewRating={(problemId) => setRatingTarget({ problemId, mode: "review" })}
            onStartSolve={startSolve}
            onStartReviewSession={() => startReviewSession()}
          />
        )}

        {page === "plan" && (
          <PlanView
            problemById={problemById}
            workspace={workspace}
            onOpenProblem={setSelectedProblemId}
            onSchedule={(problemId, date) => runProblemAction(problemId, { type: "schedule", scheduledDate: date })}
          />
        )}

        {page === "problems" && (
          <ProblemsView
            problemById={problemById}
            workspace={workspace}
            onOpenProblem={setSelectedProblemId}
            onOpenSolveRating={(problemId) => setRatingTarget({ problemId, mode: "solve" })}
            onOpenReviewRating={(problemId) => setRatingTarget({ problemId, mode: "review" })}
            onStartSolve={startSolve}
            onSchedule={(problemId, date) => runProblemAction(problemId, { type: "schedule", scheduledDate: date })}
            onSnooze={(problemId) => runProblemAction(problemId, { type: "snooze-review" })}
          />
        )}

        {page === "review" && (
          <ReviewView
            problemById={problemById}
            workspace={workspace}
            session={reviewSession}
            onStartSession={startReviewSession}
            onEndSession={() => setReviewSession(null)}
            onOpenProblem={setSelectedProblemId}
            onRateCurrent={rateCurrentReview}
            onSnoozeCurrent={snoozeCurrentReview}
          />
        )}

        {page === "insights" && <InsightsView problemById={problemById} workspace={workspace} />}
      </WorkspaceShell>

      <ProblemSheet
        problem={selectedProblem}
        record={selectedRecord}
        today={today}
        onClose={() => setSelectedProblemId(null)}
        onSaveNote={(note) => {
          if (!selectedProblemId) {
            return Promise.resolve();
          }
          return runProblemAction(selectedProblemId, { type: "save-note", note });
        }}
        onSchedule={(date) => {
          if (!selectedProblemId) {
            return Promise.resolve();
          }
          return runProblemAction(selectedProblemId, { type: "schedule", scheduledDate: date });
        }}
        onOpenRating={(mode) => {
          if (!selectedProblemId) {
            return;
          }
          setRatingTarget({ problemId: selectedProblemId, mode });
        }}
        onStartSolve={() => {
          if (!selectedProblem) {
            return Promise.resolve();
          }
          return startSolve(selectedProblem);
        }}
        onSnooze={() => {
          if (!selectedProblemId) {
            return Promise.resolve();
          }
          return runProblemAction(selectedProblemId, { type: "snooze-review" });
        }}
      />

      <SettingsPanel open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />

      {ratingTarget && (
        <RatingModal
          problem={problemById[ratingTarget.problemId]}
          mode={ratingTarget.mode}
          record={progress[String(ratingTarget.problemId)]}
          today={today}
          onClose={() => setRatingTarget(null)}
          onSubmit={submitRating}
        />
      )}
    </>
  );
}

function buildReminderTitle(reminders: StudyWorkspaceData["reminders"]) {
  if (reminders.overdueReviewCount > 0) {
    return `${reminders.dueReviewCount} reviews due, ${reminders.overdueReviewCount} overdue`;
  }
  return `${reminders.dueReviewCount} reviews are due today`;
}

function buildReminderBody(reminders: StudyWorkspaceData["reminders"]) {
  if (reminders.remainingFreshCount > 0) {
    return `Clear the review queue, then work through ${reminders.remainingFreshCount} more new problems to stay on today's suggestion of ${reminders.todayTarget}.`;
  }
  return "Today's new-problem suggestion is covered. Start with the due reviews before opening anything extra.";
}

function ReminderBanner({
  page,
  reminders,
  notificationPermission,
  onEnableNotifications,
}: {
  page: WorkspacePage;
  reminders: StudyWorkspaceData["reminders"];
  notificationPermission: NotificationState;
  onEnableNotifications: () => Promise<void>;
}) {
  if (!reminders.shouldHighlightReviews && !reminders.shouldHighlightFreshTarget) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[rgba(255,161,22,0.32)] bg-[linear-gradient(135deg,rgba(255,161,22,0.16),rgba(239,71,67,0.08))] px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Auto reminders</div>
          <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
            {reminders.dueReviewCount > 0
              ? `${reminders.dueReviewCount} review${reminders.dueReviewCount === 1 ? "" : "s"} due now`
              : "Review queue is clear"}
            {reminders.overdueReviewCount > 0 ? `, ${reminders.overdueReviewCount} overdue` : ""}.
            {" "}
            Today&apos;s new suggestion is {reminders.todayFreshCount}/{reminders.todayTarget}
            {reminders.remainingFreshCount > 0 ? `, so ${reminders.remainingFreshCount} more problem${reminders.remainingFreshCount === 1 ? "" : "s"} still need attention.` : "."}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            When you mark a solve complete, the next review is added automatically. Due reviews can trigger browser notifications once permission is enabled.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {reminders.dueReviewCount > 0 && page === "review" ? (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="rounded-full bg-[var(--clay)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Review now
            </button>
          ) : reminders.dueReviewCount > 0 ? (
            <Link
              href="/review"
              className="rounded-full bg-[var(--clay)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Open review inbox
            </Link>
          ) : null}

          {notificationPermission !== "unsupported" && notificationPermission !== "granted" && reminders.dueReviewCount > 0 ? (
            <button
              type="button"
              onClick={() => void onEnableNotifications()}
              className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
            >
              Enable browser reminders
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RatingModal({
  problem,
  mode,
  record,
  today,
  onClose,
  onSubmit,
}: {
  problem: Problem;
  mode: "solve" | "review";
  record: StudyProgressRecord | undefined;
  today: string;
  onClose: () => void;
  onSubmit: (confidence: Confidence) => Promise<void>;
}) {
  const previews = [
    { label: "Again", value: 1 as const, detail: "Reset to the shortest interval." },
    { label: "Hard", value: 2 as const, detail: "Keep the same interval." },
    { label: "Good", value: 3 as const, detail: "Move to the next review step." },
    { label: "Easy", value: 4 as const, detail: "Skip ahead one step." },
  ].map((choice) => ({
    ...choice,
    preview: reduceProgressAction({
      existing: record,
      action: mode === "solve" ? { type: "complete-solve", confidence: choice.value } : { type: "rate-review", confidence: choice.value },
      today,
    }),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(29,22,16,0.32)] p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-[34px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow-soft)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">{mode === "solve" ? "Complete solve" : "Log review"}</div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-none text-[var(--ink)]">
              #{problem.id} {problem.title}
            </h3>
            {mode === "solve" && (
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Choosing a confidence score will automatically add the next review date. No separate review scheduling step is needed.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {previews.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => onSubmit(choice.value)}
              className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-4 text-left transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
            >
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">{choice.label}</div>
              <div className="mt-3 text-sm leading-6 text-[var(--ink)]">{choice.detail}</div>
              <div className="mt-4 text-xs leading-5 text-[var(--muted)]">
                Next review {choice.preview.nextReviewDate ?? "not scheduled"} · interval {choice.preview.interval}d
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
