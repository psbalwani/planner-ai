# Planner AI

See `docs/prd.md`, `docs/data-model.md`, and `docs/mvp-roadmap.md` for the product reasoning behind what's built here.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com) (free tier is enough for v0).

3. In the Supabase SQL Editor, run `supabase/migrations/0001_init.sql` against your project.

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

   Visiting `/` should redirect to `/login`; sign in via the emailed magic link and you'll land back on `/` able to add one-off tasks.

## What's here (Phase 0)

Auth (Supabase magic link), the full schema from `docs/data-model.md`, and CRUD API routes for tasks and occurrences (`src/app/api/`). No matrix or calendar UI yet — that's Phase 1; the home page is a bare list for verifying the wiring works end to end.
