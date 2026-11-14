import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTasks } from './useTasks'
import { useScheduleForToday } from './useToday'
import { getSuggestions } from '../lib/suggestions'
import { toDateStr } from '../lib/dueDate'
import type { Task } from '../types'

// Dismissals last for the rest of the day, on this device.
const DISMISSED_KEY = 'nudge:dismissed-suggestions'
type Stored = { date: string; ids: string[] }

/**
 * Smart daily suggestions for the Today board (see lib/suggestions.ts), plus
 * the actions on them. Tasks added from here show on the board straight away
 * (returned as `justScheduled`), before the server confirms, online or off.
 *
 * @param boardIds ids the server already has on today's board
 * @param excludeIds ids to leave out (e.g. pending deletes / just moved to backlog)
 */
export function useSuggestions(boardIds: ReadonlySet<string>, excludeIds: ReadonlySet<string>) {
  const today = toDateStr(new Date())
  const { data: tasks } = useTasks()
  const scheduleForToday = useScheduleForToday()
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set())
  const [added, setAdded] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then(raw => {
        const stored: Stored | null = raw ? JSON.parse(raw) : null
        if (stored?.date === today) setDismissed(new Set(stored.ids))
      })
      .catch(() => {})
  }, [today])

  // Once the server's board has a task we added, stop tracking it here, so a
  // later "move to backlog" isn't overridden by this optimistic copy.
  useEffect(() => {
    const confirmed = [...added].filter(id => boardIds.has(id))
    if (confirmed.length) setAdded(prev => new Set([...prev].filter(id => !confirmed.includes(id))))
  }, [boardIds, added])

  const suggestions = useMemo(() => {
    const exclude = new Set([...excludeIds, ...dismissed, ...added, ...boardIds])
    return getSuggestions(tasks, { today, excludeIds: exclude })
  }, [tasks, today, excludeIds, dismissed, added, boardIds])

  const justScheduled = useMemo<Task[]>(
    () => (tasks ?? [])
      .filter(t => added.has(t.id) && !boardIds.has(t.id))
      .map(t => ({ ...t, scheduled_date: today })),
    [tasks, added, boardIds, today]
  )

  const add = useCallback((task: Task) => {
    setAdded(prev => new Set(prev).add(task.id))
    scheduleForToday.mutate(task.id, {
      onError: () => setAdded(prev => { const next = new Set(prev); next.delete(task.id); return next }),
    })
  }, [scheduleForToday])

  const addAll = useCallback(() => {
    for (const s of suggestions) add(s.task)
  }, [suggestions, add])

  const dismiss = useCallback((task: Task) => {
    setDismissed(prev => {
      const next = new Set(prev).add(task.id)
      AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify({ date: today, ids: [...next] } satisfies Stored)).catch(() => {})
      return next
    })
  }, [today])

  return { suggestions, justScheduled, add, addAll, dismiss }
}
