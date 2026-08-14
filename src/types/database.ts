export type TaskType = "one_off" | "recurring";
export type OccurrenceStatus = "pending" | "done" | "skipped" | "moved";
export type RecurrenceFrequency = "daily" | "weekly" | "custom";
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  type: TaskType;
  project_id: string | null;
  depends_on_task_id: string | null;
  default_time: string | null; // "HH:MM"
  default_duration_minutes: number | null;
  created_at: string;
}

export interface RecurrenceRule {
  task_id: string;
  frequency: RecurrenceFrequency;
  days_of_week: DayOfWeek[];
  start_date: string; // ISO date
  end_date: string | null;
}

export interface TaskOccurrence {
  id: string;
  task_id: string;
  scheduled_date: string; // ISO date
  scheduled_time: string | null;
  duration_minutes: number | null;
  status: OccurrenceStatus;
  moved_from_occurrence_id: string | null;
  created_at: string;
}

export interface CompletionEvent {
  id: string;
  occurrence_id: string;
  completed_at: string; // ISO timestamp
  note: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  goal_id: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_date: string | null;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  duration_minutes: number;
  started_at: string; // ISO timestamp
  ended_at: string | null;
  completed: boolean;
}
