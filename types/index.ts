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