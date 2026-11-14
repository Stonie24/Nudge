import { useMemo } from 'react'
import { useMutationState } from '@tanstack/react-query'
import type { Task, DailyCompletion } from '../types'

// Mutation keys (see useTasks.ts / useToday.ts) whose variables are a task id.
const TICKS = {
  completeTask: { recurring: false, done: true },
  uncompleteTask: { recurring: false, done: false },
  completeRecurring: { recurring: true, done: true },
  uncompleteRecurring: { recurring: true, done: false },
} as const

type TickKey = keyof typeof TICKS

export type PendingTicks = {
  /** Non-recurring task id → completed, for ticks not yet confirmed by the server. */
  tasks: ReadonlyMap<string, boolean>
  /** Recurring task id → done today, for ticks not yet confirmed by the server. */
  recurring: ReadonlyMap<string, boolean>
}

/**
 * Ticks (complete / uncomplete) that are in flight or queued offline —
 * including queued writes restored after a restart. Read straight from the
 * mutation cache so the UI can show them instantly and a background refetch
 * can't flip a row back before the write lands. Each mutation stays pending
 * until its invalidation refetch finishes, so there's no gap in between.
 */
export function usePendingTicks(): PendingTicks {
  const pending = useMutationState({
    filters: {
      status: 'pending',
      predicate: m => String(m.options.mutationKey?.[0]) in TICKS,
    },
    select: m => ({
      key: String(m.options.mutationKey?.[0]) as TickKey,
      id: m.state.variables as string,
    }),
  })

  return useMemo(() => {
    const tasks = new Map<string, boolean>()
    const recurring = new Map<string, boolean>()
    // Mutation cache order is submission order, so the latest tick wins
    for (const { key, id } of pending) {
      const tick = TICKS[key]
      ;(tick.recurring ? recurring : tasks).set(id, tick.done)
    }
    return { tasks, recurring }
  }, [pending])
}

/** Apply pending non-recurring ticks to a task list (returns the same array if nothing changes). */
export function applyTaskTicks<T extends Task[] | undefined>(list: T, ticks: PendingTicks): T {
  if (!list || ticks.tasks.size === 0) return list
  let changed = false
  const next = list.map(t => {
    const done = ticks.tasks.get(t.id)
    if (done === undefined || t.recurring || t.completed === done) return t
    changed = true
    return { ...t, completed: done }
  })
  return (changed ? next : list) as T
}

/** Apply pending recurring ticks to today's completions. */
export function applyCompletionTicks<T extends DailyCompletion[] | undefined>(
  list: T,
  ticks: PendingTicks,
  completedOn: string
): T {
  if (ticks.recurring.size === 0) return list
  const current: DailyCompletion[] = list ?? []
  const doneIds = new Set(current.map(c => c.task_id))
  let next: DailyCompletion[] = current
  for (const [taskId, done] of ticks.recurring) {
    if (done && !doneIds.has(taskId)) {
      next = [...next, { id: `pending-${taskId}`, task_id: taskId, user_id: '', completed_on: completedOn }]
    } else if (!done && doneIds.has(taskId)) {
      next = next.filter(c => c.task_id !== taskId)
    }
  }
  return (next === current ? list : next) as T
}
