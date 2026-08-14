# Data Model (v0)

## Core design decision: Task (template) vs Occurrence (instance)

A recurring `Task` is a template ("Exercise", repeats Mon/Wed/Fri). It never itself holds a completion state. Each date it applies to materializes a `TaskOccurrence` row. This split is what makes the rest of the model work:

- The matrix's Task × Day checkbox is exactly one `TaskOccurrence` row — nothing more to model.
- Moving a task to a different day (the arrow in the original sketch) is `moved_from_occurrence_id` pointing at the original occurrence, instead of mutating the recurrence rule or losing the history that it moved.
- Completion attaches to a specific point in time (`CompletionEvent`), not a boolean on the task — this is the row the future adaptive-planning features read from. Get this wrong and there's nothing to learn from later.

## Entities

**User**
- id, email, created_at

**Task**
- id, user_id, title, type (`one_off` | `recurring`)
- project_id (nullable, → Project)
- depends_on_task_id (nullable, self-reference — single "blocked by" link, not a full dependency graph in v0)
- default_time (nullable), default_duration_minutes (nullable)
- created_at

**RecurrenceRule** (only for `type = recurring`)
- task_id
- frequency (`daily` | `weekly` | `custom`)
- days_of_week (array, e.g. `[MON, WED]`)
- start_date, end_date (nullable)

**TaskOccurrence**
- id, task_id
- scheduled_date, scheduled_time (nullable), duration_minutes (nullable)
- status (`pending` | `done` | `skipped` | `moved`)
- moved_from_occurrence_id (nullable, self-reference)
- One row per calendar date a task applies to — for one-off tasks, exactly one row ever; for recurring tasks, one row per scheduled date, generated on a rolling window (e.g. 4 weeks ahead), not all at once for infinite recurrences.

**CompletionEvent**
- id, occurrence_id, completed_at (timestamp — the actual moment, not just "today"), note (nullable)
- Append-only. `TaskOccurrence.status` is a denormalized read of the latest event, but the event log is the source of truth.

**Project**
- id, user_id, name, goal_id (nullable)

**Goal**
- id, user_id, name, target_date (nullable)

**StreakSnapshot** (derived/cached, not authoritative)
- task_id, current_streak, longest_streak, computed_at
- Recomputed from `CompletionEvent` on read or via a scheduled job — never hand-written, so it can be safely dropped and rebuilt.

**Insight** (v1+, schema reserved now so v0 data is shaped correctly for it later)
- id, user_id, type, payload (jsonb), generated_at, dismissed (bool)

## Why relational (Postgres/Supabase), not document (Mongo/Firebase)

This model is relationships-first: occurrences reference tasks, completions reference occurrences, tasks reference projects/goals/other tasks. Foreign keys and joins are the natural fit; a document store would mean either deep nesting (breaks when an occurrence moves or a task's recurrence changes) or manual reference-following with none of the integrity guarantees. Postgres also makes the eventual analytics queries (completion rate by time-of-day, streak calculations, pattern detection) straightforward SQL instead of application-side aggregation.

## What v0 deliberately does NOT model

- Full dependency DAG with cycle detection — one optional `depends_on_task_id` is enough to prove the concept; a graph engine is real complexity with no evidence yet that users need multi-level dependencies.
- Multi-user/shared tasks — no `shared_with` or permissions table yet.
- Recurring rule exceptions beyond "moved" (e.g., "skip this one week but keep the series") — handle via `status = skipped` on the occurrence for now rather than building an exception-rule DSL.
