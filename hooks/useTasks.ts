import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resumableMutation } from '../lib/resumableMutation'
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
})

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
})

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
})

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
})

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

const updateTask = resumableMutation('updateTask', async ({ id, tag }: { id: string; tag?: string }) => {
  const { error } = await supabase
    .from('tasks')
    .update({ tag: tag ?? null })
    .eq('id', id)
  if (error) throw error
})

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    ...updateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
