"use client";

import Link from "next/link";

export type WorkspacePage = "dashboard" | "plan" | "problems" | "review" | "insights";

type WorkspaceShellProps = {
  page: WorkspacePage;
  stats: {
    dueReviews: number;
    todayProgress: string;
    todayTarget: number;
    completionRate: number;
    overdueReviews: number;
  };
  onOpenSettings: () => void;
  children: React.ReactNode;
};

const NAV_ITEMS: Array<{ page: WorkspacePage; href: string; label: string; kicker: string }> = [
  { page: "dashboard", href: "/", label: "Dashboard", kicker: "Today-first" },
  { page: "plan", href: "/plan", label: "Plan", kicker: "Weekly board" },
  { page: "problems", href: "/problems", label: "Problems", kicker: "Database" },
  { page: "review", href: "/review", label: "Review", kicker: "Focus mode" },
  { page: "insights", href: "/insights", label: "Insights", kicker: "Weak spots" },
];

const PAGE_COPY: Record<WorkspacePage, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Daily desk",
    title: "Run today before you browse the backlog.",
    description: "Due reviews, fresh problems, and quick session entry points stay above the fold.",
  },
  plan: {
    eyebrow: "Planning board",
    title: "Shape the week like a notebook, not a spreadsheet.",
    description: "Drag mentally, reschedule quickly, and keep daily capacity visible.",
  },
  problems: {
    eyebrow: "Problem database",
    title: "Search the library without losing the next action.",
    description: "Every row keeps solve, review, and note actions explicit.",
  },
  review: {
    eyebrow: "Review inbox",
    title: "Recall first, rate second.",
    description: "Step through due problems in a focused sequence instead of a giant table.",
  },
  insights: {
    eyebrow: "Study signals",
    title: "See where memory is slipping before it becomes churn.",
    description: "Topic pressure, overdue load, and completion health stay readable.",
  },
};

export function WorkspaceShell({ page, stats, onOpenSettings, children }: WorkspaceShellProps) {
  const copy = PAGE_COPY[page];

  return (
    <div className="min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow-soft)] lg:space-y-4 lg:p-5">
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-1)] p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">LeetPlan OS</p>
            <h1 className="mt-3 max-w-[14ch] font-[family-name:var(--font-display)] text-[1.55rem] font-semibold leading-tight text-[var(--ink)] lg:text-[1.9rem]">
              Your LeetCode board, with planning built in.
            </h1>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)] lg:mt-4 lg:text-sm lg:leading-6">
              Practice queue, review queue, deadline board, and insights in one dark workspace.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = item.page === page;
              return (
                <Link
                  key={item.page}
                  href={item.href}
                  className={`block rounded-[16px] border px-3 py-3 transition-all lg:rounded-[18px] lg:px-4 ${
                    active
                      ? "border-[rgba(255,161,22,0.38)] bg-[rgba(255,161,22,0.12)] shadow-[var(--shadow-card)]"
                      : "border-[var(--line)] bg-[var(--surface-1)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="hidden text-[11px] uppercase tracking-[0.24em] text-[var(--muted)] lg:block">{item.kicker}</div>
                  <div className="flex items-center justify-between lg:mt-2">
                    <span className="text-sm font-medium text-[var(--ink)] lg:text-base">{item.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[var(--accent)]" : "bg-[var(--surface-4)]"}`} />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label="Due" value={stats.dueReviews} tone="alert" />
            <SummaryTile label="Today" value={stats.todayProgress} tone="accent" href="/#today-completed" clickable={true} />
            <SummaryTile label="Done" value={`${stats.completionRate}%`} tone="calm" />
            <SummaryTile label="Overdue" value={stats.overdueReviews} tone="neutral" />
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-3 text-left transition-all hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
          >
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Settings</div>
            <div className="mt-2 text-base font-medium text-[var(--ink)]">Tune the deadline & review pace</div>
          </button>
        </aside>

        <div className="space-y-4">
          <header className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] shadow-[var(--shadow-soft)]">
            <div className="grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">{copy.eyebrow}</p>
                <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[2.2rem] font-semibold leading-[1.06] text-[var(--ink)]">
                  {copy.title}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">{copy.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 self-start">
                <TopMetric title="Due reviews" value={stats.dueReviews} detail="Start from urgency, not from the full list." />
                <TopMetric title="Today progress" value={stats.todayProgress} detail={`Completed today against the current ${stats.todayTarget}-problem suggestion.`} />
                <TopMetric title="Completion" value={`${stats.completionRate}%`} detail="Solved problems with active memory schedules." />
                <TopMetric title="Overdue" value={stats.overdueReviews} detail="Review debt that should be absorbed first." />
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  href,
  clickable = false,
}: {
  label: string;
  value: number | string;
  tone: "alert" | "accent" | "calm" | "neutral";
  href?: string;
  clickable?: boolean;
}) {
  const toneClass =
    tone === "alert"
      ? "border-[rgba(239,71,67,0.26)] bg-[rgba(239,71,67,0.1)]"
      : tone === "accent"
        ? "border-[rgba(255,161,22,0.28)] bg-[rgba(255,161,22,0.12)]"
        : tone === "calm"
          ? "border-[rgba(45,181,93,0.22)] bg-[rgba(45,181,93,0.1)]"
          : "border-[var(--line)] bg-[var(--surface-1)]";

  const content = (
    <div
      className={`rounded-[22px] border px-4 py-3 ${toneClass} ${
        clickable ? "transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]" : ""
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-[1.5rem] font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function TopMetric({ title, value, detail }: { title: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-1)] p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{title}</div>
      <div className="mt-3 text-[2rem] font-semibold leading-none text-[var(--ink)]">{value}</div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}
