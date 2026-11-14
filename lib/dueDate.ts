// Due dates are stored as plain 'YYYY-MM-DD' strings (Postgres `date`) and
// compared in the device's local time, like scheduled_date elsewhere.

const DAY_MS = 86400000

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

/** Local-midnight Date for a 'YYYY-MM-DD' string (avoids UTC parsing shifting the day). */
export function parseDateStr(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

/** Whole days from `from` to `to` (both 'YYYY-MM-DD'); negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDateStr(to).getTime() - parseDateStr(from).getTime()) / DAY_MS)
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later' | 'done'

export type DueInfo = { label: string; tone: DueTone }

/**
 * How to show a task's due date, or null when there's nothing to show.
 * `done` tasks keep their date but never read as overdue.
 */
export function getDueInfo(
  dueDate: string | null | undefined,
  { done = false, today = toDateStr(new Date()) }: { done?: boolean; today?: string } = {}
): DueInfo | null {
  if (!dueDate) return null
  const diff = daysBetween(today, dueDate)
  const short = formatShortDate(dueDate, diff)

  if (done) return { label: `Due ${short}`, tone: 'done' }
  if (diff < 0) return { label: `Overdue · ${-diff}d`, tone: 'overdue' }
  if (diff === 0) return { label: 'Due today', tone: 'today' }
  if (diff === 1) return { label: 'Due tomorrow', tone: 'soon' }
  if (diff < 7) return { label: `Due ${short}`, tone: 'soon' }
  return { label: `Due ${short}`, tone: 'later' }
}

/** Weekday name within the coming week ("Fri"), otherwise "24 Nov". */
function formatShortDate(dateStr: string, diffFromToday: number): string {
  const d = parseDateStr(dateStr)
  if (diffFromToday > 1 && diffFromToday < 7) {
    return d.toLocaleDateString('en-SE', { weekday: 'short' })
  }
  return d.toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })
}

/** Sort comparator: earliest due first, tasks without a due date last. */
export function compareDueDates(a: string | null | undefined, b: string | null | undefined): number {
  if (a && b) return a < b ? -1 : a > b ? 1 : 0
  if (a) return -1
  if (b) return 1
  return 0
}
