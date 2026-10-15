import { useMemo } from 'react'
import { useQuery, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resumableMutation } from '../lib/resumableMutation'
import type { Task, DailyCompletion } from '../types'

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Fetch today's tasks:
// - recurring tasks (always show)
// - tasks scheduled for today
export function useTodayTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`recurring.eq.true,scheduled_date.eq.${today()}`)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

// Fetch today's completions (for recurring tasks)
export function useTodayCompletions() {
  return useQuery<DailyCompletion[]>({
    queryKey: ['completions', today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_completions')
        .select('*')
        .eq('completed_on', today())
      if (error) throw error
      return data
    },
  })
}

// Complete a recurring task for today
const completeRecurring = resumableMutation('completeRecurring', async (taskId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase
    .from('daily_completions')
    .upsert({ task_id: taskId, user_id: user.id, completed_on: today() }, { onConflict: 'task_id,completed_on' })
  if (error) throw error
})

export function useCompleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    ...completeRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['completions'] }),
  })
}

// Uncomplete a recurring task for today
const uncompleteRecurring = resumableMutation('uncompleteRecurring', async (taskId: string) => {
  const { error } = await supabase
    .from('daily_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('completed_on', today())
  if (error) throw error
})

export function useUncompleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    ...uncompleteRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['completions'] }),
  })
}

// Schedule an existing task for today
const scheduleForToday = resumableMutation('scheduleForToday', async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .update({ scheduled_date: today() })
    .eq('id', taskId)
  if (error) throw error
})

export function useScheduleForToday() {
  const queryClient = useQueryClient()
  return useMutation({
    ...scheduleForToday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Add a brand new task to today (optionally recurring)
type AddTodayTaskVars = { id?: string; title: string; tag?: string; recurring: boolean }

// Client-generated id so a task can be shown before the insert lands and keep
// the same identity (and list key) once the server row replaces it.
export function newTaskId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = Math.random() * 16 | 0
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const addTodayTask = resumableMutation('addTodayTask', async ({ id, title, tag, recurring }: AddTodayTaskVars) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...(id ? { id } : {}),
      title,
      tag: tag ?? null,
      user_id: user.id,
      recurring,
      scheduled_date: recurring ? null : today(),
    })
    .select()
    .single()
  if (error) throw error
  return data
})

export function useAddTodayTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...addTodayTask,
    // Returned so the mutation stays pending until the refetch lands —
    // otherwise the optimistic row would vanish for a frame in between.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

// Tasks added to today that the server hasn't confirmed yet (in flight, or
// queued while offline — including queued writes restored after a restart).
export function usePendingTodayTasks(): Task[] {
  const pending = useMutationState({
    filters: { mutationKey: addTodayTask.mutationKey, status: 'pending' },
    select: (mutation): Task | null => {
      const vars = mutation.state.variables as AddTodayTaskVars | undefined
      if (!vars?.id) return null
      return {
        id: vars.id,
        user_id: '',
        title: vars.title,
        tag: vars.tag,
        completed: false,
        recurring: vars.recurring,
        scheduled_date: vars.recurring ? undefined : today(),
        created_at: new Date(mutation.state.submittedAt || Date.now()).toISOString(),
      }
    },
  })
  // useMutationState keeps `pending` referentially stable while nothing changes
  return useMemo(() => pending.filter((t): t is Task => t !== null), [pending])
}
