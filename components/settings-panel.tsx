"use client";

import { useEffect, useState } from "react";

import type { StudySettings } from "@/lib/study";

type SettingsPanelProps = {
  open: boolean;
  settings: StudySettings;
  onClose: () => void;
  onSave: (settings: StudySettings) => Promise<void>;
};

export function SettingsPanel({ open, settings, onClose, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  if (!open) {
    return null;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(29,22,16,0.32)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--line)] bg-[var(--panel-strong)] px-6 py-6 shadow-[var(--shadow-soft)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Workspace settings</p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-none text-[var(--ink)]">
              Tune the plan instead of living with hard-coded numbers.
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
              Solves automatically seed the next review. The planner recalculates the daily new-problem suggestion from the remaining pool and your deadline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
          >
            Close
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <Field
            label="Plan deadline"
            hint="The planner spreads the remaining unsolved pool across every day from today through this date."
            value={draft.planDeadline}
            onChange={(value) => setDraft((current) => ({ ...current, planDeadline: value }))}
            type="date"
          />
          <Field
            label="Default snooze days"
            hint="How many days a review should move when you choose snooze."
            value={draft.defaultSnoozeDays}
            type="number"
            onChange={(value) => setDraft((current) => ({ ...current, defaultSnoozeDays: value }))}
          />
          <Field
            label="Review session size"
            hint="Maximum number of items to include in one focus review block."
            value={draft.reviewSessionSize}
            type="number"
            onChange={(value) => setDraft((current) => ({ ...current, reviewSessionSize: value }))}
          />
        </div>

        <div className="mt-8 rounded-[26px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Current shape</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Summary label="Deadline" value={draft.planDeadline} />
            <Summary label="Snooze step" value={`${draft.defaultSnoozeDays}d`} />
            <Summary label="Review block" value={`${draft.reviewSessionSize} items`} />
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            Browser reminders appear when reviews are due, and the new-problem suggestion rebalances itself as you fall behind or pull ahead.
          </p>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-3)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  type,
  onChange,
}: {
  label: string;
  hint: string;
} & (
  | {
    value: string;
    type: "date";
    onChange: (value: string) => void;
  }
  | {
    value: number;
    type: "number";
    onChange: (value: number) => void;
  }
)) {
  return (
    <label className="block rounded-[26px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
      <div className="text-sm font-medium text-[var(--ink)]">{label}</div>
      <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{hint}</div>
      <input
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(event) => {
          if (type === "number") {
            onChange(Math.max(1, Number(event.target.value) || 1));
            return;
          }
          onChange(event.target.value);
        }}
        className="mt-4 w-full rounded-[18px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-xl font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}
