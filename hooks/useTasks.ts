import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resumableMutation, taskWriteScope } from '../lib/resumableMutation'
import { useMemo } from 'react'
import { usePendingTicks, applyTaskTicks } from './usePendingTicks'
import type { Task } from '../types'

export function useTasks() {
  const query = useQuery<Task[]>({
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
  // Ticks show instantly, before the server confirms them
  const ticks = usePendingTicks()
  const data = useMemo(() => applyTaskTicks(query.data, ticks), [query.data, ticks])
  return { ...query, data }
}

const addTask = resumableMutation('addTask', async ({ title, tag }: { title: string; tag?: string }) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, tag: tag ?? null, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}, taskWriteScope)

export function useAddTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...addTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

const completeTask = resumableMutation('completeTask', async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}, taskWriteScope)

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

const uncompleteTask = resumableMutation('uncompleteTask', async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .update({ completed: false, completed_at: null })
    .eq('id', id)
  if (error) throw error
}, taskWriteScope)

export function useUncompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...uncompleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

const deleteTask = resumableMutation('deleteTask', async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  if (error) throw error
}, taskWriteScope)

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

const updateTask = resumableMutation('updateTask', async ({ id, tag, title, recurring, scheduled_date, notes }: {
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
}, taskWriteScope)

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...updateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
