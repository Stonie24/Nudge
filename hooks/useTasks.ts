import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Task } from '../types'

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, tag }: { title: string; tag?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, tag: tag ?? null, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUncompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: false, completed_at: null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tag, title, recurring, scheduled_date, notes }: {
      id: string
      tag?: string
      title?: string
      recurring?: boolean
      scheduled_date?: string | null
      notes?: string
    }) => {
      // tag always writes (undefined clears it) to preserve every existing
      // caller's behavior; the rest only update when explicitly provided,
      // so a partial save (e.g. from the task detail sheet) can't clobber
      // fields it isn't touching.
      const updates: Record<string, unknown> = { tag: tag ?? null }
      if (title !== undefined) updates.title = title
      if (recurring !== undefined) updates.recurring = recurring
      if (scheduled_date !== undefined) updates.scheduled_date = scheduled_date
      if (notes !== undefined) updates.notes = notes || null
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}