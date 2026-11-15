import type { Task, DailyCompletion } from '../types'
import { addDays, toDateStr } from './dueDate'

// Weeks run Monday–Sunday (ISO / Swedish convention), in the device's local time.

/** The Monday ('YYYY-MM-DD') of the week containing `date`. */
export function weekStartOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  d.setDate(d.getDate() - offset)
  return toDateStr(d)
}

export type DayStats = {
  date: string
  /** One-off tasks completed that day. */
  tasks: number
  /** Daily-habit check-ins that day. */
  habits: number
  total: number
  isToday: boolean
  isFuture: boolean
}

export type HabitRow = {
  task: Task
  /** One entry per day Mon–Sun: done, missed, or not applicable (future / before the habit existed). */
  days: ('done' | 'missed' | 'na')[]
  doneCount: number
}

export type TagStat = { tag: string; count: number }

export type WeekStats = {
  start: string
  end: string
  days: DayStats[]
  totalTasks: number
  totalHabits: number
  total: number
  /** Days so far this week (today included) on which every habit that existed was done. */
  perfectHabitDays: number
  /** Days in the week that have started (7 for past weeks). */
  elapsedDays: number
  habits: HabitRow[]
  /** Completions per tag (one-offs + habit check-ins), most first; untagged as "No tag". */
  tags: TagStat[]
  /** One-off tasks completed this week, most recent first. */
  completedTasks: Task[]
  bestDay: DayStats | null
}

/**
 * Builds the weekly overview from tasks (one-offs carry `completed_at`) and
 * daily_completions (habit check-ins). Pure, so it's easy to test.
 */
export function getWeekStats({
  tasks,
  completions,
  weekStart,
  today,
}: {
  tasks: readonly Task[] | undefined
  completions: readonly DailyCompletion[] | undefined
  weekStart: string
  today: string
}): WeekStats {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const end = dates[6]
  const inWeek = (d: string) => d >= weekStart && d <= end
  const all = tasks ?? []

  // One-off completions, by local completion date. A tick that hasn't synced
  // yet (shown done instantly, e.g. offline) has no completed_at: count it today.
  const doneOn = (t: Task) => (t.completed_at ? toDateStr(new Date(t.completed_at)) : today)
  const completedTasks = all
    .filter(t => !t.recurring && t.completed && inWeek(doneOn(t)))
    .sort((a, b) => (b.completed_at ?? '\uffff').localeCompare(a.completed_at ?? '\uffff'))
  const tasksByDay = new Map<string, number>()
  for (const t of completedTasks) {
    const d = doneOn(t)
    tasksByDay.set(d, (tasksByDay.get(d) ?? 0) + 1)
  }

  // Habit check-ins (only for habits that still exist).
  const habitsList = all.filter(t => t.recurring)
  const habitIds = new Set(habitsList.map(t => t.id))
  const doneByDay = new Map<string, Set<string>>()
  for (const c of completions ?? []) {
    if (!inWeek(c.completed_on) || !habitIds.has(c.task_id)) continue
    if (!doneByDay.has(c.completed_on)) doneByDay.set(c.completed_on, new Set())
    doneByDay.get(c.completed_on)!.add(c.task_id)
  }

  const days: DayStats[] = dates.map(date => {
    const tasksDone = tasksByDay.get(date) ?? 0
    const habitsDone = doneByDay.get(date)?.size ?? 0
    return {
      date,
      tasks: tasksDone,
      habits: habitsDone,
      total: tasksDone + habitsDone,
      isToday: date === today,
      isFuture: date > today,
    }
  })

  const existedOn = (t: Task, date: string) => toDateStr(new Date(t.created_at)) <= date
  const habits: HabitRow[] = habitsList.map(task => {
    const cells = dates.map(date => {
      if (date > today || !existedOn(task, date)) return 'na' as const
      return doneByDay.get(date)?.has(task.id) ? 'done' as const : 'missed' as const
    })
    return { task, days: cells, doneCount: cells.filter(c => c === 'done').length }
  })

  const elapsed = dates.filter(d => d <= today)
  const perfectHabitDays = elapsed.filter(date => {
    const required = habitsList.filter(t => existedOn(t, date))
    return required.length > 0 && required.every(t => doneByDay.get(date)?.has(t.id))
  }).length

  const tagCounts = new Map<string, number>()
  const bump = (tag: string | undefined) => tagCounts.set(tag ?? 'No tag', (tagCounts.get(tag ?? 'No tag') ?? 0) + 1)
  for (const t of completedTasks) bump(t.tag)
  for (const [, ids] of doneByDay) for (const id of ids) bump(habitsList.find(h => h.id === id)?.tag)
  const tags = [...tagCounts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))

  const totalTasks = completedTasks.length
  const totalHabits = days.reduce((n, d) => n + d.habits, 0)
  const best = days.reduce<DayStats | null>((m, d) => (d.total > 0 && (!m || d.total > m.total) ? d : m), null)

  return {
    start: weekStart,
    end,
    days,
    totalTasks,
    totalHabits,
    total: totalTasks + totalHabits,
    perfectHabitDays,
    elapsedDays: elapsed.length,
    habits,
    tags,
    completedTasks,
    bestDay: best,
  }
}

/** "9–15 Nov" (same month) or "27 Oct – 2 Nov". */
export function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00')
  const month = (d: Date) => d.toLocaleDateString('en-SE', { month: 'short' })
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} ${month(e)}`
    : `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)}`
}

/**
 * One plain sentence about the week, e.g. "Your best day was Friday (3 done),
 * and Health was the tag you did most." Null for an empty week.
 */
export function getWeekInsight(stats: WeekStats, { isCurrentWeek }: { isCurrentWeek: boolean }): string | null {
  if (stats.total === 0 || !stats.bestDay) return null
  const dayName = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('en-SE', { weekday: 'long' })

  if (isCurrentWeek && stats.elapsedDays === 1) {
    return `A good start: ${stats.total} done on ${dayName(stats.bestDay.date)}.`
  }

  const best = stats.bestDay
  const first = isCurrentWeek
    ? `So far, ${dayName(best.date)} is your best day (${best.total} done)`
    : `Your best day was ${dayName(best.date)} (${best.total} done)`

  // Second half, in order of preference: every habit every day > top tag > most consistent habit.
  let second: string | null = null
  if (stats.habits.length > 0 && stats.elapsedDays >= 2 && stats.perfectHabitDays === stats.elapsedDays) {
    second = isCurrentWeek ? 'and you’ve done every habit every day' : 'and you did every habit every day'
  } else {
    const topTag = stats.tags.find(t => t.tag !== 'No tag')
    if (topTag && topTag.count >= 2) {
      second = `and ${topTag.tag} was the tag you did most`
    } else {
      const steady = [...stats.habits].sort((a, b) => b.doneCount - a.doneCount)[0]
      if (steady && steady.doneCount >= 2) second = `and ${steady.task.title} was your most consistent habit`
    }
  }
  return second ? `${first}, ${second}.` : `${first}.`
}
