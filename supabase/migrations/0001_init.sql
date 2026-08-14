-- Planner AI v0 schema.
-- See docs/data-model.md for the reasoning behind the Task/Occurrence/CompletionEvent split.
-- StreakSnapshot and Insight are deferred until Phase 4 actually needs them (see docs/mvp-roadmap.md) —
-- no table created for either yet.

create extension if not exists pgcrypto;

create type task_type as enum ('one_off', 'recurring');
create type occurrence_status as enum ('pending', 'done', 'skipped', 'moved');
create type recurrence_frequency as enum ('daily', 'weekly', 'custom');
create type day_of_week as enum ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_date date,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  goal_id uuid references goals (id) on delete set null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type task_type not null,
  project_id uuid references projects (id) on delete set null,
  depends_on_task_id uuid references tasks (id) on delete set null,
  default_time time,
  default_duration_minutes integer,
  created_at timestamptz not null default now()
);

-- One row per recurring task; absent for one_off tasks.
create table recurrence_rules (
  task_id uuid primary key references tasks (id) on delete cascade,
  frequency recurrence_frequency not null,
  days_of_week day_of_week[] not null default '{}',
  start_date date not null,
  end_date date
);

-- One row per calendar date a task applies to. For one_off tasks there is
-- exactly one row ever; for recurring tasks, rows are materialized on a
-- rolling window rather than for the whole recurrence up front.
create table task_occurrences (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  scheduled_date date not null,
  scheduled_time time,
  duration_minutes integer,
  status occurrence_status not null default 'pending',
  moved_from_occurrence_id uuid references task_occurrences (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Append-only behavioral log. task_occurrences.status is a denormalized read
-- of the latest event; this table is the source of truth for adaptive planning.
create table completion_events (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references task_occurrences (id) on delete cascade,
  completed_at timestamptz not null default now(),
  note text
);

create index task_occurrences_task_date_idx on task_occurrences (task_id, scheduled_date);
create index completion_events_occurrence_idx on completion_events (occurrence_id);

-- Row Level Security: every table is scoped to the owning user, either
-- directly (user_id column) or transitively through tasks.task_id / occurrence_id.

alter table goals enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table recurrence_rules enable row level security;
alter table task_occurrences enable row level security;
alter table completion_events enable row level security;

create policy "own goals" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own projects" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own recurrence rules" on recurrence_rules
  for all using (
    exists (select 1 from tasks where tasks.id = recurrence_rules.task_id and tasks.user_id = auth.uid())
  )
  with check (
    exists (select 1 from tasks where tasks.id = recurrence_rules.task_id and tasks.user_id = auth.uid())
  );

create policy "own occurrences" on task_occurrences
  for all using (
    exists (select 1 from tasks where tasks.id = task_occurrences.task_id and tasks.user_id = auth.uid())
  )
  with check (
    exists (select 1 from tasks where tasks.id = task_occurrences.task_id and tasks.user_id = auth.uid())
  );

create policy "own completion events" on completion_events
  for all using (
    exists (
      select 1
      from task_occurrences
      join tasks on tasks.id = task_occurrences.task_id
      where task_occurrences.id = completion_events.occurrence_id and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from task_occurrences
      join tasks on tasks.id = task_occurrences.task_id
      where task_occurrences.id = completion_events.occurrence_id and tasks.user_id = auth.uid()
    )
  );
