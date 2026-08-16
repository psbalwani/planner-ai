# Planner AI

An AI-native productivity app built around **behavioral adaptive planning**: instead of just tracking what you said you'd do, it learns from what you actually did and surfaces that back to you (time-of-day and day-of-week completion patterns, declining-streak nudges).

See `docs/prd.md`, `docs/data-model.md`, and `docs/mvp-roadmap.md` for the product reasoning behind what's built here.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com) (free tier is enough).

3. In the Supabase SQL Editor, run the migrations in order:

   ```
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_focus_sessions.sql
   ```

4. In Supabase project settings, enable **Email** auth and turn on the magic-link (OTP) sign-in method (on by default for most new projects).

5. Copy `.env.local.example` to `.env.local` and fill in your project's URL and anon key (Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

6. Run the dev server:

   ```
   npm run dev
   ```

   Visiting `/` redirects to `/login`; sign in via the emailed magic link and you'll land on the Matrix.

## What's here

- **Matrix** (`/matrix`) — recurring tasks as a task × day-of-week grid, with per-task streaks and an inline-editable time.
- **Day** (`/day`) — one-off, time-bound tasks for a given date, with done/skip/move/delete actions.
- **Insights** (`/insights`) — behavioral insights computed from completion history: time-of-day and day-of-week completion-rate comparisons (each gated on minimum sample size and gap, so noise doesn't get surfaced as a false pattern), a declining-task nudge, a completion heatmap, and a weekly completion-rate trend line. A "seed demo history" button (dev-only) backfills synthetic data so these are testable without waiting weeks for real usage.
- **Focus** (`/focus`) — a Pomodoro-style timer, optionally linked to a task, that persists sessions as another source of behavioral data.

Data model: `Task` (template) → `TaskOccurrence` (per-date instance) → `CompletionEvent` (append-only log) — see `docs/data-model.md` for why it's shaped this way.

## Testing

```
npm test        # run the unit test suite (Vitest)
npm run typecheck
npm run lint
npm run build
```

Tests cover the pure behavioral-logic modules in `src/lib/` (streaks, insights, decline nudges, stats) — the code most likely to silently regress as thresholds get tuned. UI/integration behavior is currently verified manually; there's no end-to-end test suite yet.

## Error handling

API routes return `{ error: string }` on failure. Client components call them through `apiFetch` (`src/lib/api.ts`), which throws on a non-ok response; callers catch and surface the message via a toast (`src/components/toast-provider.tsx`) rather than failing silently.
