# Planner AI — Product Requirements (v0)

## Vision

Every productivity tool on the market is an editor of your *stated intentions* — you tell it what you plan to do, and it stores that. None of them close the loop against what you *actually did*, and use that gap to adjust future suggestions. Planner AI's bet: unify task tracking, habit/streak tracking, and completion history into one data model, so the product can eventually say "you say you'll work out at 6am, but you complete workouts at 8pm 80% of the time — should I stop suggesting 6am?" That adaptive loop is the differentiator, not another matrix UI, not another chatbot bolted onto a to-do list.

Motion and Sunsama already do AI-assisted scheduling around a calendar. We are not competing on "AI schedules your day" — we're competing on "AI learns from what you actually did," which none of them do because none of them track habits and tasks in the same place with the same fidelity.

## Non-negotiable design principle

**Adaptive planning requires behavioral history before it can work.** You cannot ship "detects you skip 6am workouts" on day one — there's no data. So v0's real job is to capture rich, correctly-shaped completion data (timestamped events, not booleans) from the first day of use, even though the adaptive features that consume that data ship later. Get the data model wrong now and the differentiator never becomes buildable.

## Target user (v0)

A single person (starting with the builder) juggling recurring habits (exercise, reading, coding practice) and project/deadline-driven tasks, who currently loses fidelity switching between a habit tracker and a task manager. Not designing for teams or multi-user collaboration in v0.

## The matrix, reconsidered

The hand-drawn sketch (tasks × days, checkboxes, an arrow drawn out of one cell to indicate a move) is correct for recurring/habit-style tasks and wrong as the sole interface:

- A checkbox has no room for time-of-day, duration, or "why didn't this happen." Habits are naturally boolean-per-day; tasks aren't.
- The arrow drawn on the sketch is the user inventing a "this got moved" gesture because the grid has none. That's a data-model gap (see `data-model.md` — `moved_from_occurrence_id`), not a drawing quirk.
- Conclusion: the matrix is **one view** over the data (and a genuinely good one for habits/streaks), not the primary interface and not the data model itself. One-off, time-bound tasks get a day-list/calendar view instead.

## MVP scope (v0) — must ship

1. Unified task model: one-off or recurring tasks (see `data-model.md`), each optionally carrying time-of-day + duration.
2. Matrix view: rows = recurring tasks, columns = days, checkbox per cell, streak displayed per row.
3. Day-list view: one-off, time-bound tasks not suited to the matrix.
4. Completion logging as timestamped events, not boolean flags — the foundation the adaptive features depend on later.
5. Reschedule/move: moving a task's occurrence to another day is a first-class action, not a workaround.
6. Natural-language quick-add: "Study DSA every Monday and Wednesday" → a recurring task, via a single Claude tool-use call. Smallest AI feature that still proves the AI-native premise on day one.

## Explicitly deferred (v1+, not v0)

- Adaptive/pattern-based recommendations, burnout detection, forecasting — need weeks of real completion data first; building them against zero data is building against a guess.
- Task dependency graphs beyond a single optional "blocked by" reference.
- Kanban view, timeline view, gamification, collaboration/multi-user, native mobile, external calendar sync.

Reasoning: solo dev, 80/20 rule. Every one of these is a real feature people would want eventually; none of them is what makes this product different from Notion or Todoist. Build the differentiator's foundation first.

## Success signal for v0

Not user growth — it's a single question: after 3–4 weeks of personal use, does the completion-event log contain enough signal to produce one genuinely non-obvious insight ("you finish coding tasks scheduled after 8pm at 3x the rate of ones scheduled before noon")? If yes, the adaptive-planning bet is buildable. If the data can't produce that, the data model needs to change before writing more UI.
