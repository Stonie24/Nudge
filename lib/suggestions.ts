import type { Task } from '../types'
import { addDays, daysBetween, parseDateStr, getDueInfo } from './dueDate'
import type { Rhythm } from './insights'

/** Due within this many days (today included) counts as "due soon". */
export const DUE_SOON_DAYS = 3
/** Never suggest more than this many at once, so the card stays a nudge, not a second list. */
export const MAX_SUGGESTIONS = 5

export type SuggestionReason = 'overdue' | 'leftover' | 'dueSoon' | 'rhythm'

/** At most this many "you often do X on <day>" suggestions at once. */
export const MAX_RHYTHM_SUGGESTIONS = 2

export type Suggestion = {
  task: Task
  reason: SuggestionReason
  /** Short explanation shown under the title, e.g. "Overdue · 2d" or "Left over from Tue". */
  label: string
}

const REASON_RANK: Record<SuggestionReason, number> = { overdue: 0, leftover: 1, dueSoon: 2, rhythm: 3 }

/**
 * Picks backlog tasks worth putting on today's board:
 *  1. overdue: due date has passed
 *  2. leftover: was on an earlier day's board and never finished
 *  3. dueSoon: due today or within the next few days
 *  4. rhythm: undated backlog task with a tag you usually do on this weekday
 * Recurring, completed and already-on-today tasks are never suggested.
 *
 * `room` (from your usual pace) limits how many are offered: overdue tasks
 * are always included, the rest only fill the room left on today's board.
 */
export function getSuggestions(
  tasks: readonly Task[] | undefined,
  {
    today,
    excludeIds = new Set<string>(),
    limit = MAX_SUGGESTIONS,
    rhythms = [],
    room = null,
  }: {
    today: string
    excludeIds?: ReadonlySet<string>
    limit?: number
    rhythms?: readonly Rhythm[]
    /** Slots left on today's board by your usual pace; null when pace isn't known yet. */
    room?: number | null
  }
): Suggestion[] {
  if (!tasks) return []
  const soonLimit = addDays(today, DUE_SOON_DAYS)
  const out: Suggestion[] = []

  for (const task of tasks) {
    if (task.recurring || task.completed || excludeIds.has(task.id)) continue
    if (task.scheduled_date === today) continue // already on the board

    const due = task.due_date ?? null
    if (due && due < today) {
      out.push({ task, reason: 'overdue', label: getDueInfo(due, { today })!.label })
    } else if (task.scheduled_date && task.scheduled_date < today) {
      out.push({ task, reason: 'leftover', label: leftoverLabel(task.scheduled_date, today) })
    } else if (due && due <= soonLimit) {
      out.push({ task, reason: 'dueSoon', label: getDueInfo(due, { today })!.label })
    } else if (!task.scheduled_date && !due && task.tag) {
      const rhythm = rhythms.find(r => r.tag === task.tag)
      if (rhythm) out.push({ task, reason: 'rhythm', label: rhythm.label })
    }
  }

  out.sort((a, b) =>
    REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
    // Within a group, the most pressing first: earliest due date, else oldest board day.
    sortKey(a).localeCompare(sortKey(b)) ||
    a.task.created_at.localeCompare(b.task.created_at)
  )
  // Keep only the first few rhythm suggestions (they're a gentle hint, not a to-do list).
  let rhythmCount = 0
  const ranked = out.filter(s => s.reason !== 'rhythm' || ++rhythmCount <= MAX_RHYTHM_SUGGESTIONS)

  if (room === null || room === undefined) return ranked.slice(0, limit)
  const overdue = ranked.filter(s => s.reason === 'overdue')
  const rest = ranked.filter(s => s.reason !== 'overdue').slice(0, Math.max(0, room - overdue.length))
  return [...overdue, ...rest].slice(0, limit)
}

function sortKey(s: Suggestion): string {
  return (s.reason === 'leftover' ? s.task.scheduled_date : s.task.due_date) ?? ''
}

function leftoverLabel(scheduledDate: string, today: string): string {
  const daysAgo = daysBetween(scheduledDate, today)
  if (daysAgo === 1) return 'Left over from yesterday'
  if (daysAgo < 7) {
    return `Left over from ${parseDateStr(scheduledDate).toLocaleDateString('en-SE', { weekday: 'short' })}`
  }
  return `Left over from ${parseDateStr(scheduledDate).toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })}`
}
