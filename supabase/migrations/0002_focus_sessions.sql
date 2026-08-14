-- Pomodoro focus sessions. Optionally linked to a task so completed sessions
-- become another behavioral signal (see src/lib/insight.ts for the pattern),
-- but the link is nullable since a focus session doesn't require a task.

create table focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  duration_minutes integer not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  completed boolean not null default false
);

create index focus_sessions_user_started_idx on focus_sessions (user_id, started_at);

alter table focus_sessions enable row level security;

create policy "own focus sessions" on focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
