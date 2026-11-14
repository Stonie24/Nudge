export type Task = {
  id: string
  user_id: string
  title: string
  completed: boolean
  tag?: string
  created_at: string
  completed_at?: string
  recurring: boolean
  scheduled_date?: string
  /** Optional deadline ('YYYY-MM-DD'), separate from scheduled_date. Never set on recurring tasks. */
  due_date?: string | null
  notes?: string
  /** Flat checklist (subtasks). Missing on rows created before migration 008. */
  checklist?: ChecklistItem[]
}

export type ChecklistItem = {
  id: string
  title: string
  done: boolean
}

export type DailyCompletion = {
  id: string
  task_id: string
  user_id: string
  completed_on: string
}

export type User = {
  id: string
  email: string
}

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  all_day: boolean
  color: string
  source: 'nudge' | 'google' | 'apple'
  external_id?: string
}

export type DayData = {
  date: string
  events: CalendarEvent[]
  tasks: Task[]
  completedTaskIds: string[]
}