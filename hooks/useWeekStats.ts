import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useTasks } from './useTasks'
import { usePendingTicks, applyCompletionTicks } from './usePendingTicks'
import { getWeekStats } from '../lib/weekly'
import { addDays, toDateStr } from '../lib/dueDate'
import type { DailyCompletion } from '../types'

/**
 * Weekly overview for the week starting `weekStart` (a Monday). Habit
 * check-ins are fetched per week, so earlier weeks can be browsed; today's
 * not-yet-synced ticks are overlaid so the numbers move the moment you tick.
 */
export function useWeekStats(weekStart: string) {
  const weekEnd = addDays(weekStart, 6)
  const today = toDateStr(new Date())
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const ticks = usePendingTicks()

  const completions = useQuery<DailyCompletion[]>({
    queryKey: ['completions', 'week', weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_completions')
        .select('*')
        .gte('completed_on', weekStart)
        .lte('completed_on', weekEnd)
      if (error) throw error
      return data
    },
  })

  const stats = useMemo(() => {
    const withTicks = today >= weekStart && today <= weekEnd
      ? applyCompletionTicks(completions.data, ticks, today)
      : completions.data
    return getWeekStats({ tasks, completions: withTicks, weekStart, today })
  }, [tasks, completions.data, ticks, weekStart, weekEnd, today])

  return { stats, isLoading: tasksLoading || completions.isLoading }
}
