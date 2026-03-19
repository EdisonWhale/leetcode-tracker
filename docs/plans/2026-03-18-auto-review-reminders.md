# Auto Review Reminders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** raise the daily solve target to at least 15, automatically keep solved problems in the review pipeline, and surface due-review reminders without manual review queue management.

**Architecture:** keep the review schedule generation in the shared study-domain reducer, extend the workspace view model with reminder metadata derived from due reviews and today's target, and let the client workspace trigger browser notifications plus a persistent in-app reminder banner. Settings stay file-backed, but the daily target floor moves to 15 so the weekly planner always stages enough fresh work.

**Tech Stack:** Next.js App Router, React 19 client components, TypeScript, Vitest

### Task 1: Lock the behavior with tests

**Files:**
- Modify: `tests/lib/study.test.ts`

**Step 1: Write failing tests**

Add tests that assert:
- `normalizeSettings()` floors `dailyNewTarget` to `15`
- `buildStudyWorkspace()` exposes reminder metadata for due reviews and an under-target solve day
- `reduceProgressAction({ type: "complete-solve" })` still auto-seeds the next review date/session

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/study.test.ts`
Expected: FAIL because the current settings floor is `1` and the workspace model does not expose reminder metadata.

### Task 2: Extend the study domain

**Files:**
- Modify: `lib/study.ts`
- Modify: `app/api/settings/route.ts`
- Modify: `data/settings.json`

**Step 1: Write minimal implementation**

Update the study-domain types and builders so that:
- the default daily target is `15`
- normalized settings never drop below `15`
- the workspace returns a reminder summary describing due review count, overdue count, today's fresh target, and whether today's fresh queue is under target

**Step 2: Run test to verify it passes**

Run: `npm test -- tests/lib/study.test.ts`
Expected: PASS for the updated study-domain expectations.

### Task 3: Trigger reminders in the client workspace

**Files:**
- Modify: `components/study-workspace.tsx`
- Modify: `components/workspace-shell.tsx`
- Modify: `components/dashboard-view.tsx`
- Modify: `components/settings-panel.tsx`

**Step 1: Add client reminder flow**

Implement:
- a persistent banner showing due-review pressure and today's 15-problem target gap
- browser notification permission request and due-review notifications when permission is granted
- settings copy that makes the 15-problem floor explicit and tells the user review entries are auto-created after solve completion

**Step 2: Keep behavior safe**

Only notify once per distinct due-review snapshot while the page is open, so the app does not spam notifications.

### Task 4: Verify

**Files:**
- No code changes required

**Step 1: Run targeted tests**

Run: `npm test -- tests/lib/study.test.ts`
Expected: PASS

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS with no new errors
