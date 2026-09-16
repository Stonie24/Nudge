import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useTasks } from './useTasks'

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Streaks longer than this are undercounted rather than paginating history —
// a reasonable v1 limit for a personal task app.
const STREAK_WINDOW_DAYS = 120

function useRecentCompletions() {
  return useQuery({
    queryKey: ['completions', 'streak-window'],
    queryFn: async () => {
      const since = toDateStr(new Date(Date.now() - STREAK_WINDOW_DAYS * 86400000))
      const { data, error } = await supabase
        .from('daily_completions')
        .select('task_id, completed_on')
        .gte('completed_on', since)
      if (error) throw error
      return data as { task_id: string; completed_on: string }[]
    },
  })
}

/**
 * Current streak = consecutive days (walking back from today) where every
 * recurring task that existed by that day was completed. A task created
 * partway through the window only becomes "required" from its own
 * created_at onward, so adding a new daily habit today doesn't retroactively
 * zero out a streak built on the habits that already existed.
 *
 * Today itself doesn't have to be complete yet for the streak to still
 * show yesterday's count — it just doesn't get credited until it's done.
 */
export function useStreak() {
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const { data: completions, isLoading: completionsLoading } = useRecentCompletions()

  const recurringTasks = (tasks ?? [])
    .filter(t => t.recurring)
    .map(t => ({ id: t.id, created_at: t.created_at }))

  let streak = 0

  if (recurringTasks.length > 0 && completions) {
    const byDay = new Map<string, Set<string>>()
    for (const c of completions) {
      if (!byDay.has(c.completed_on)) byDay.set(c.completed_on, new Set())
      byDay.get(c.completed_on)!.add(c.task_id)
    }

    function isDayComplete(dateStr: string): boolean {
      const dayEnd = new Date(`${dateStr}T23:59:59`)
      const requiredIds = recurringTasks
        .filter(t => new Date(t.created_at) <= dayEnd)
        .map(t => t.id)
      if (requiredIds.length === 0) return false
      const doneIds = byDay.get(dateStr)
      if (!doneIds) return false
      return requiredIds.every(id => doneIds.has(id))
    }

    const cursor = new Date()
    if (!isDayComplete(toDateStr(cursor))) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (isDayComplete(toDateStr(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
  }

  return { streak, isLoading: tasksLoading || completionsLoading }
}
