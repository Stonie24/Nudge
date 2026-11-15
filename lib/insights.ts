import type { Task } from '../types'
import { addDays, parseDateStr, toDateStr } from './dueDate'

// Patterns learned from your own completion history, computed on the device.
// Kept deliberately simple and explainable: every number here can be shown to
// the user as a plain sentence.

/** How far back to look. */
export const HISTORY_DAYS = 56 // 8 weeks
/** Pace needs at least this many past occurrences of the weekday with activity… */
const MIN_PACE_WEEKS = 2
/** …and at least this many completions in total, before it's shown. */
const MIN_PACE_COMPLETIONS = 5
/** A tag is a weekday "rhythm" with at least this many completions on that weekday… */
const MIN_RHYTHM_COUNT = 3
/** …making up at least this share of the tag's completions (1/7 ≈ 0.14 would be "no pattern"). */
const MIN_RHYTHM_SHARE = 0.3

const weekdayOf = (date: string) => parseDateStr(date).getDay() // 0 = Sunday
export const weekdayName = (date: string, plural = false) =>
  parseDateStr(date).toLocaleDateString('en-SE', { weekday: 'long' }) + (plural ? 's' : '')

/** Local completion dates of one-off tasks in the window before `today` (today excluded). */
function pastCompletions(tasks: readonly Task[], today: string) {
  const from = addDays(today, -HISTORY_DAYS)
  return tasks
    .filter(t => !t.recurring && t.completed && t.completed_at)
    .map(t => ({ task: t, date: toDateStr(new Date(t.completed_at!)) }))
    .filter(c => c.date >= from && c.date < today)
}

/** First day the person used the app (earliest task created), so new users aren't averaged over empty weeks. */
function firstActiveDay(tasks: readonly Task[]): string | null {
  let first: string | null = null
  for (const t of tasks) {
    const d = toDateStr(new Date(t.created_at))
    if (!first || d < first) first = d
  }
  return first
}

export type Pace = {
  /** Typical number of one-off tasks finished on this weekday (rounded, at least 1). */
  typical: number
  /** How many past same-weekdays it's based on. */
  weeks: number
  /** e.g. "Saturdays" */
  weekdayLabel: string
}

/**
 * How many one-off tasks you usually finish on today's weekday, averaged over
 * the same weekday in the last 8 weeks (only weeks since you started).
 * Null until there's enough history to say anything honest.
 */
export function getPace(tasks: readonly Task[] | undefined, today: string): Pace | null {
  if (!tasks?.length) return null
  const first = firstActiveDay(tasks)
  if (!first) return null
  const wd = weekdayOf(today)
  const windowStart = addDays(today, -HISTORY_DAYS)
  const start = first > windowStart ? first : windowStart

  // Past occurrences of today's weekday inside [start, today).
  let weeks = 0
  for (let d = addDays(today, -7); d >= start; d = addDays(d, -7)) weeks++
  const all = pastCompletions(tasks, today).filter(c => c.date >= start)
  if (weeks < MIN_PACE_WEEKS || all.length < MIN_PACE_COMPLETIONS) return null

  const onWeekday = all.filter(c => weekdayOf(c.date) === wd).length
  const typical = Math.max(1, Math.round(onWeekday / weeks))
  return { typical, weeks, weekdayLabel: weekdayName(today, true) }
}

export type Rhythm = { tag: string; count: number; label: string }

/**
 * Tags you tend to work on on today's weekday: at least 3 completions on that
 * weekday in the last 8 weeks, and a clearly bigger share than on other days.
 */
export function getRhythms(tasks: readonly Task[] | undefined, today: string): Rhythm[] {
  if (!tasks?.length) return []
  const wd = weekdayOf(today)
  const byTag = new Map<string, { total: number; onDay: number }>()
  for (const { task, date } of pastCompletions(tasks, today)) {
    if (!task.tag) continue
    const s = byTag.get(task.tag) ?? { total: 0, onDay: 0 }
    s.total++
    if (weekdayOf(date) === wd) s.onDay++
    byTag.set(task.tag, s)
  }
  const days = weekdayName(today, true)
  return [...byTag]
    .filter(([, s]) => s.onDay >= MIN_RHYTHM_COUNT && s.onDay / s.total >= MIN_RHYTHM_SHARE)
    .sort((a, b) => b[1].onDay - a[1].onDay || a[0].localeCompare(b[0]))
    .map(([tag, s]) => ({ tag, count: s.onDay, label: `You often do ${tag} on ${days}` }))
}

/** One-off tasks planned for today (on the board, done or not). */
export function plannedToday(boardTasks: readonly Task[] | undefined): number {
  return (boardTasks ?? []).filter(t => !t.recurring).length
}
