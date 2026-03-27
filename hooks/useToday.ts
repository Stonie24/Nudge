import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
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
export function useCompleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { error } = await supabase
        .from('daily_completions')
        .upsert({ task_id: taskId, user_id: user.id, completed_on: today() }, { onConflict: 'task_id,completed_on' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['completions'] }),
  })
}

// Uncomplete a recurring task for today
export function useUncompleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('daily_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('completed_on', today())
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['completions'] }),
  })
}

// Schedule an existing task for today
export function useScheduleForToday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ scheduled_date: today() })
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Add a brand new task to today (optionally recurring)
export function useAddTodayTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, tag, recurring }: { title: string; tag?: string; recurring: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { data, error } = await supabase
        .from('tasks')
        .insert({
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}