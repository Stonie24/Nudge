import type { Task } from '../types'

// Focus mode works through today's unfinished tasks one at a time.
// Pure helpers so the queue rules are easy to test.

/**
 * The order to work through: today's unfinished tasks in board order, with
 * skipped tasks moved to the back (in the order they were skipped), and an
 * optional starting task pulled to the front.
 */
export function focusQueue(
  pending: readonly Task[],
  { skipped = [], startWith = null }: { skipped?: readonly string[]; startWith?: string | null } = {}
): Task[] {
  const ids = new Set(pending.map(t => t.id))
  const skippedHere = skipped.filter(id => ids.has(id))
  const skippedSet = new Set(skippedHere)
  const byId = new Map(pending.map(t => [t.id, t]))
  let order = [
    ...pending.filter(t => !skippedSet.has(t.id)),
    ...skippedHere.map(id => byId.get(id)!),
  ]
  // The chosen first task goes first, unless it has since been skipped.
  if (startWith && ids.has(startWith) && !skippedSet.has(startWith)) {
    order = [byId.get(startWith)!, ...order.filter(t => t.id !== startWith)]
  }
  return order
}

/** Moves a task to the back of the skip order (re-skipping moves it again). */
export function skip(skipped: readonly string[], id: string): string[] {
  return [...skipped.filter(s => s !== id), id]
}

export const TIMER_PRESETS = [15, 25, 45] as const

/** "24:59" (or "1:05:00" past an hour); never negative. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

export type TimerState =
  | { status: 'off' }
  | { status: 'running'; endsAt: number; minutes: number }
  | { status: 'paused'; remainingMs: number; minutes: number }
  | { status: 'finished'; minutes: number }

/** Remaining time; based on a wall-clock end time so it stays right if the app is backgrounded. */
export function remainingMs(timer: TimerState, now: number): number {
  if (timer.status === 'running') return Math.max(0, timer.endsAt - now)
  if (timer.status === 'paused') return timer.remainingMs
  return 0
}
