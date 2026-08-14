# MVP Roadmap & Stack (v0)

## Stack decisions

**Frontend: Next.js.** Solo dev, single deploy target (Vercel), largest ecosystem/AI-tooling support. Svelte's smaller bundle and Vue's ergonomics aren't worth a smaller community when the bottleneck is your own build speed, not runtime performance.

**Backend: Next.js API routes / route handlers — no separate service in v0.** Standing up FastAPI/Django/Go alongside a single-user MVP is infra that doesn't pay for itself yet. Revisit only if the AI/analytics layer needs heavier background compute than request/response — then add a small, narrowly-scoped worker for *that*, not a general second backend.

**Database: Postgres via Supabase.** The data model (`data-model.md`) is relationships-first — Mongo/Firebase's document model actively fights it. Supabase adds auth and Postgres in one setup step, which matters more than any Firebase realtime convenience at this stage.

**Real-time: skip for v0.** Single user, no collaboration yet. Cheap to add later via Supabase realtime if multi-tab/multi-device sync becomes annoying.

**AI: Claude API directly, no framework.** v0's only AI feature is single-shot NL→structured-task parsing (one tool-use call). LangChain/Mastra/ADK earn their keep once there's a genuinely multi-step agentic flow (e.g., a future "build me a 2-week exam study plan" feature); adding one now is orchestration overhead for a call that doesn't need orchestrating.

## Phases

**Phase 0 — Foundation**
Auth (Supabase auth), schema from `data-model.md`, basic CRUD for Task/Occurrence.

**Phase 1 — The two views**
Matrix view (recurring tasks × days, checkbox, streak per row) and day-list view (one-off, time-bound tasks). This is the minimum to stop losing fidelity between habit-tracking and task-tracking.

**Phase 2 — NL quick-add**
"Study DSA every Monday and Wednesday" → Claude tool-use call → recurring Task + RecurrenceRule. Proves the AI-native premise immediately, independent of any history-dependent feature.

**Phase 3 — Reschedule as a first-class action**
Move an occurrence to another date, writing `moved_from_occurrence_id`. This directly resolves the arrow-on-paper gesture from the original sketch instead of leaving it as an unsupported workaround.

**Phase 4 — First adaptive insight (gate: only after ~3–4 weeks of real completion data)**
One simple, non-ML stat surfaced from `CompletionEvent` — e.g., completion rate by time-of-day-scheduled. The goal is to prove the loop (behavior → insight → suggestion) with the simplest possible computation before investing in anything more sophisticated. If the completion log can't produce a non-obvious stat by this point, that's a signal to revisit the data model, not to add more AI.

## Explicitly out of scope for this roadmap

Dependency graphs, burnout detection, forecasting, gamification, collaboration, native mobile, external calendar sync — see `prd.md` for reasoning. Not "never," just not what proves the core bet.
