import type { Task } from '../types'
import { addDays, daysBetween, toDateStr } from './dueDate'

// Backlog clean-up: old, undated, untouched tasks get a "Still want to do this?".

/** A backlog task this many days old (or older) is offered for clean-up. */
export const STALE_AFTER_DAYS = 30
/** "Keep" hides a task from the prompt for this long. */
export const KEEP_FOR_DAYS = 30
/** Ask about at most this many at a time. */
export const MAX_STALE = 3

export type StaleTask = { task: Task; ageDays: number; label: string }

/**
 * Undone backlog tasks added 30+ days ago that have no due date and aren't
 * planned for any day: the ones most likely to have gone stale. Tasks you
 * chose to keep are skipped until their keep period ends. Oldest first.
 *
 * (There's no "last edited" date on tasks, so age is measured from when the
 * task was added; a due date or a board day counts as "still planned".)
 */
export function getStaleTasks(
  tasks: readonly Task[] | undefined,
  { today, keptUntil = {} }: { today: string; keptUntil?: Readonly<Record<string, string>> }
): StaleTask[] {
  if (!tasks) return []
  return tasks
    .filter(t => !t.recurring && !t.completed && !t.due_date && !t.scheduled_date)
    .filter(t => !keptUntil[t.id] || keptUntil[t.id] < today)
    .map(t => {
      const ageDays = daysBetween(toDateStr(new Date(t.created_at)), today)
      return { task: t, ageDays, label: ageLabel(ageDays) }
    })
    .filter(s => s.ageDays >= STALE_AFTER_DAYS)
    .sort((a, b) => b.ageDays - a.ageDays || a.task.title.localeCompare(b.task.title))
    .slice(0, MAX_STALE)
}

/** "Added 5 weeks ago" / "Added 3 months ago". */
export function ageLabel(days: number): string {
  if (days < 60) return `Added ${Math.round(days / 7)} weeks ago`
  const months = Math.round(days / 30)
  return `Added ${months} month${months === 1 ? '' : 's'} ago`
}

/** The date until which a kept task stays out of the prompt. */
export function keepUntil(today: string): string {
  return addDays(today, KEEP_FOR_DAYS)
}
