import type { Task, DailyCompletion } from '../types'
import { addDays, toDateStr } from './dueDate'

// "Habits at risk": gentle, explainable flags from your own habit history.

/** Look at this many days before today when judging whether a habit is slipping. */
export const SLIP_WINDOW_DAYS = 3
/** …and flag it when it was missed on at least this many of them. */
export const SLIP_MIN_MISSED = 2
/** The streak reminder appears from this local hour (18 = 6 pm). */
export const EVENING_HOUR = 18
/** …and only when this few habits are left, so it reads as "almost there", not a scolding. */
export const STREAK_SAVER_MAX_LEFT = 2

export type Slip = { missed: number; outOf: number; label: string }

/**
 * Daily habits you've been slipping on: missed on at least 2 of the last 3
 * days (today not counted). A habit only qualifies once it has existed for the
 * whole window, so a habit added yesterday isn't "slipping".
 */
export function getSlippingHabits(
  habits: readonly Task[],
  completions: readonly Pick<DailyCompletion, 'task_id' | 'completed_on'>[] | undefined,
  today: string
): Map<string, Slip> {
  const days = Array.from({ length: SLIP_WINDOW_DAYS }, (_, i) => addDays(today, -(i + 1)))
  const oldest = days[days.length - 1]
  const doneOn = new Set((completions ?? []).map(c => `${c.task_id}|${c.completed_on}`))
  const out = new Map<string, Slip>()
  for (const h of habits) {
    if (!h.recurring) continue
    if (toDateStr(new Date(h.created_at)) > oldest) continue // too new to judge
    const missed = days.filter(d => !doneOn.has(`${h.id}|${d}`)).length
    if (missed >= SLIP_MIN_MISSED) {
      out.set(h.id, { missed, outOf: SLIP_WINDOW_DAYS, label: `Missed ${missed} of the last ${SLIP_WINDOW_DAYS} days` })
    }
  }
  return out
}

/**
 * "1 habit left to keep your 5-day streak": in the evening, when you have a
 * streak going and only one or two habits are still open today.
 */
export function getStreakSaver({
  habitsLeftToday,
  streak,
  hour,
}: {
  habitsLeftToday: number
  streak: number
  hour: number
}): string | null {
  if (hour < EVENING_HOUR || streak <= 0) return null
  if (habitsLeftToday < 1 || habitsLeftToday > STREAK_SAVER_MAX_LEFT) return null
  const what = habitsLeftToday === 1 ? '1 habit' : `${habitsLeftToday} habits`
  // Non-breaking hyphen (U+2011) keeps "5-day" on one line when the text wraps.
  return `${what} left to keep your ${streak}\u2011day streak`
}
