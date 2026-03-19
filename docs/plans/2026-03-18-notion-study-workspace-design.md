# Notion-Style Study Workspace Design

**Product goal:** turn the current tracker into a study workspace that tells the user what to do today, keeps planning separate from the problem database, and makes review a focused session instead of a status toggle.

## Chosen Direction

Three options were considered:

1. Keep the table-first tracker and only split the solve/review button.
2. Build a multi-view workspace with a dashboard, weekly plan, problem database, review inbox, and insights.
3. Build a heavier coaching system that auto-manages every decision.

The recommended direction is option 2. It fixes the information architecture problem without requiring a fully opinionated coaching engine.

## Information Architecture

The app should revolve around five views backed by one study dataset:

- `Dashboard`: Today-first overview with due reviews, today's new problems, session entry points, recent progress, and weak-topic hints.
- `Plan`: weekly planning board grouped by day, with quick rescheduling and a visible daily capacity.
- `Problems`: full database view for searching, filtering, opening LeetCode, inspecting notes, and manually scheduling work.
- `Review`: focused review inbox and one-problem-at-a-time session flow.
- `Insights`: progress, weak-topic surfacing, volume by day, and review health.

This moves the giant problem table out of the default landing experience and makes the primary job obvious.

## Data Model

The old `status: solved | review | null` model is too small because it mixes learning stage with user action. The new record shape should represent:

- planning: `scheduledDate`
- solving lifecycle: `workflowState` such as `backlog`, `active`, `done`
- learning lifecycle: `learningState` such as `new`, `learning`, `strengthening`, `mastered`
- review system: `interval`, `nextReviewDate`, `reviewCount`, `lastConfidence`
- context: `note`, `lastSessionDate`, `sessions`

User interactions should become explicit actions such as `schedule`, `start-solve`, `complete-solve`, `rate-review`, `snooze-review`, and `save-note`.

## UX Principles

- The primary CTA should always describe one action, never a state cycle.
- Reviews should be shown as due, upcoming, or snoozed, not hidden behind a generic `review` label.
- Dates should be contextualized with labels like `Due today`, `Overdue 2d`, or `Tomorrow`.
- Notes should be captured in a structured prompt that encourages pattern, mistake, and recall details.
- Planning should support manual reshuffling without making the user fight the system.

## Visual Direction

The interface should move away from the current GitHub-dark tracker look and toward an editorial, Notion-adjacent workspace:

- warm paper background
- graphite text
- soft panel surfaces with subtle gradients
- one serif display font and one practical sans font
- strong hierarchy between dashboard cards and lower-priority analytics
- mobile-friendly stacked cards instead of dense data rows

## Technical Direction

- Extract pure study-domain logic into shared helpers so API routes and UI read the same rules.
- Normalize legacy records on read so existing `progress.json` data still works.
- Add persisted settings so goals and planning horizon are configurable instead of hard-coded.
- Keep the stack simple: Next.js app router, filesystem JSON persistence, client-side fetch for mutations, and tested utility functions.
