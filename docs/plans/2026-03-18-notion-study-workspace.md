# Notion Study Workspace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** rebuild the tracker into a Notion-style study workspace with explicit solve/review flows, a weekly plan, a focus review session, and configurable planning settings.

**Architecture:** move product rules into a shared study-domain module, migrate the progress API to explicit actions, and rebuild the UI as multiple views over the same dataset. The dashboard becomes the default entry, while planning, database, review, and insight views become separate pages inside a shared shell.

**Tech Stack:** Next.js app router, React 19, TypeScript, Tailwind CSS v4, filesystem JSON APIs, Vitest.

### Task 1: Add planning docs and test harness

**Files:**
- Create: `docs/plans/2026-03-18-notion-study-workspace-design.md`
- Create: `docs/plans/2026-03-18-notion-study-workspace.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`

**Step 1: Add Vitest script and config**

Add `test` script and a minimal `vitest.config.ts` with the repo root alias.

**Step 2: Install test dependency**

Run: `npm install -D vitest`

**Step 3: Verify test runner starts**

Run: `npm test -- --run`
Expected: no tests found and exit code for empty suite or similar startup output.

### Task 2: Write failing study-domain tests

**Files:**
- Create: `tests/lib/study.test.ts`

**Step 1: Write tests for the new behavior**

Cover:

- legacy progress normalization
- auto-planning unscheduled problems across the week
- explicit `complete-solve` action seeding review data
- `rate-review` action updating interval and learning state
- dashboard summary separating due reviews and today's planned new problems

**Step 2: Run tests to verify failure**

Run: `npm test -- --run tests/lib/study.test.ts`
Expected: failures for missing study-domain module or missing exports.

### Task 3: Implement normalized study models and action reducers

**Files:**
- Create: `lib/study.ts`
- Create: `lib/dates.ts`
- Create: `data/settings.json`

**Step 1: Implement core types and helpers**

Add record normalization, settings defaults, planning helpers, insight helpers, and progress action reducers.

**Step 2: Re-run tests**

Run: `npm test -- --run tests/lib/study.test.ts`
Expected: green suite for the study-domain tests.

### Task 4: Move API routes to the new action model

**Files:**
- Modify: `app/api/progress/route.ts`
- Create: `app/api/settings/route.ts`

**Step 1: Route progress writes through explicit actions**

Support actions like `schedule`, `start-solve`, `complete-solve`, `rate-review`, `snooze-review`, `save-note`, and `clear-progress`.

**Step 2: Add persisted settings endpoint**

Expose `GET` and `POST` for study settings backed by `data/settings.json`.

**Step 3: Re-run tests and lint**

Run: `npm test -- --run`
Run: `npm run lint`

### Task 5: Rebuild the UI around the new product architecture

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Modify: `app/review/page.tsx`
- Create: `app/plan/page.tsx`
- Create: `app/problems/page.tsx`
- Create: `app/insights/page.tsx`
- Create: `components/workspace-shell.tsx`
- Create: `components/dashboard-view.tsx`
- Create: `components/plan-view.tsx`
- Create: `components/problems-view.tsx`
- Create: `components/review-view.tsx`
- Create: `components/insights-view.tsx`
- Create: `components/problem-sheet.tsx`
- Create: `components/settings-panel.tsx`
- Create: `components/study-workspace.tsx`

**Step 1: Add shared shell and visual system**

Build the sidebar, top summary strip, typography, panels, and responsive layout.

**Step 2: Build Today dashboard**

Show due reviews, today's planned new problems, quick actions, recent sessions, and weak-topic summaries.

**Step 3: Build weekly plan board**

Show upcoming days, planned problems, capacity usage, and quick rescheduling controls.

**Step 4: Build database view**

Replace the cycle button with explicit actions and keep search/filter/sort for the full problem library.

**Step 5: Rebuild review into focus mode**

Start from the due inbox, then step through one problem at a time with reveal, note access, snooze, and confidence rating.

**Step 6: Add insights view and settings panel**

Surface topic mastery, overdue pressure, recent volume, and configurable planning targets.

### Task 6: Verify behavior end to end

**Files:**
- No new source files required

**Step 1: Run automated checks**

Run: `npm test -- --run`
Run: `npm run lint`

**Step 2: Run browser verification**

Check:

- dashboard CTA clarity
- explicit solve and review actions
- plan rescheduling
- review session flow
- responsive layout sanity

**Step 3: Capture residual risks**

Document anything not covered by automated tests, especially file-backed persistence edge cases and mobile layout nuances.
