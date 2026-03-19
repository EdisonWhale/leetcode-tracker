# Deadline-Driven Study Plan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** replace the fixed daily-target planner with a fixed-pool, deadline-driven planner that dynamically adjusts new-problem suggestions and shows reviews as part of daily workload.

**Architecture:** keep progress and review behavior in `lib/study.ts`, but change planning from a static `planningWindowDays` plus `dailyNewTarget` model into a deadline-based schedule computed from the full unsolved pool. The workspace should expose per-day review load, suggested new count, total workload, and deadline progress so the UI can explain why a given day is heavy or light.

**Tech Stack:** Next.js app router, React 19, TypeScript, Tailwind CSS v4, filesystem JSON APIs, Vitest.

### Task 1: Lock the new planning behavior with tests

**Files:**
- Modify: `tests/lib/study.test.ts`

**Step 1: Write a failing workspace test for deadline-driven distribution**

Assert that unfinished problems are spread across all days between `today` and `planDeadline`, using `ceil(remaining / remainingDays)` behavior instead of a fixed per-day target.

**Step 2: Write a failing workspace test for review-inclusive workload**

Assert that each plan day exposes due reviews separately and also reports combined workload metadata for that day.

**Step 3: Write a failing workspace test for dynamic catch-up**

Assert that when some problems are already completed, the recommended new count drops, and when fewer problems are done, later days absorb the remainder.

**Step 4: Write a failing UI-state test for unopened backlog problems**

Assert that selecting a problem with no persisted progress still produces a usable empty record for the detail sheet.

**Step 5: Run the focused test file**

Run: `npm test -- --run tests/lib/study.test.ts`
Expected: failures referencing missing deadline settings and/or missing plan metadata.

### Task 2: Replace fixed-target settings with deadline-driven settings

**Files:**
- Modify: `lib/study.ts`
- Modify: `data/settings.json`
- Modify: `app/api/settings/route.ts`

**Step 1: Change the settings model**

Replace `dailyNewTarget` and `planningWindowDays` with a `planDeadline` date while keeping `defaultSnoozeDays` and `reviewSessionSize`.

**Step 2: Normalize settings defensively**

Ensure invalid or missing deadlines fall back to a reasonable future date and remain serializable via the settings API.

**Step 3: Re-run the focused test file**

Run: `npm test -- --run tests/lib/study.test.ts`
Expected: remaining failures should now be about workspace planning output, not settings shape.

### Task 3: Implement deadline-driven workspace planning

**Files:**
- Modify: `lib/study.ts`

**Step 1: Build a deadline date range**

Generate plan days from `today` through `planDeadline`, inclusive.

**Step 2: Rework plan allocation**

Honor explicitly scheduled unsolved problems, then fill remaining days from the unsolved pool using dynamic `ceil(remaining / remainingDays)` allocation.

**Step 3: Add plan metadata**

Expose per-day `suggestedNewCount`, `reviewLoadCount`, `totalLoadCount`, `remainingProblemCount`, and top-level deadline summary values needed by the UI.

**Step 4: Fix related workspace correctness issues**

Correct `duePressure` double counting and ensure topic counts distinguish backlog from active work.

**Step 5: Re-run the focused test file**

Run: `npm test -- --run tests/lib/study.test.ts`
Expected: green suite for study-domain behavior.

### Task 4: Update the workspace UI to explain the new plan

**Files:**
- Modify: `components/study-workspace.tsx`
- Modify: `components/plan-view.tsx`
- Modify: `components/dashboard-view.tsx`
- Modify: `components/insights-view.tsx`
- Modify: `components/settings-panel.tsx`
- Modify: `components/problem-sheet.tsx`

**Step 1: Feed normalized empty records into the problem sheet**

Use workspace-derived records so every problem can open even before first mutation.

**Step 2: Update the plan page copy and metrics**

Explain deadline progress, remaining unsolved count, review load, and the dynamic suggested new count per day.

**Step 3: Update dashboard and insights summaries**

Show deadline-aware workload language instead of fixed-capacity language.

**Step 4: Update settings UI**

Replace daily target / visible days controls with a deadline picker while preserving snooze and review session settings.

### Task 5: Verify the new planner end to end

**Files:**
- No new source files required

**Step 1: Run automated checks**

Run: `npm test -- --run`
Run: `npm run lint`

**Step 2: Verify the key flows manually**

Check:

- backlog problems open their detail sheet without existing progress
- plan page shows all days through the deadline
- review counts appear alongside new-problem suggestions
- changing the deadline updates the plan

**Step 3: Capture residual risks**

Document any remaining edge cases around past deadlines, manual scheduling outside the deadline window, and large-plan scrolling.
