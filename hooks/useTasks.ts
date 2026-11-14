import { useQuery, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resumableMutation, taskWriteScope } from '../lib/resumableMutation'
import { useMemo } from 'react'
import { usePendingTicks, applyTaskTicks } from './usePendingTicks'
import { usePendingEdits, applyTaskEdits } from './usePendingEdits'
import { toDateStr } from '../lib/dueDate'
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
  // Adds, ticks and edits show instantly, before the server confirms them
  // (also while offline).
  const ticks = usePendingTicks()
  const edits = usePendingEdits()
  const adds = usePendingBacklogAdds()
  const data = useMemo(() => {
    let list = query.data
    if (adds.length) {
      const ids = new Set(list?.map(t => t.id))
      const unsaved = adds.filter(t => !ids.has(t.id))
      if (unsaved.length) list = [...unsaved, ...(list ?? [])] // newest first, like the query
    }
    return applyTaskEdits(applyTaskTicks(list, ticks), edits)
  }, [query.data, ticks, edits, adds])
  return { ...query, data }
}

type AddTaskVars = { id?: string; title: string; tag?: string }

const addTask = resumableMutation('addTask', async ({ id, title, tag }: AddTaskVars) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { data, error } = await supabase
    .from('tasks')
    // A client-generated id lets the task show before the insert lands.
    .insert({ ...(id ? { id } : {}), title, tag: tag ?? null, user_id: user.id })
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

// Keys of mutations that create a task with a client-generated id.
const ADD_KEYS = new Set(['addTask', 'addTodayTask'])

/**
 * Tasks still being added (or queued offline), from the backlog sheet or from
 * quick-add / the Add Task sheet, shown in All tasks before the server has them.
 */
function usePendingBacklogAdds(): Task[] {
  const pending = useMutationState({
    filters: { status: 'pending', predicate: m => ADD_KEYS.has(String(m.options.mutationKey?.[0])) },
    select: (m): Task | null => {
      const v = m.state.variables as (AddTaskVars & { recurring?: boolean }) | undefined
      if (!v?.id) return null
      const toToday = m.options.mutationKey?.[0] === 'addTodayTask'
      const recurring = toToday && !!v.recurring
      return {
        id: v.id,
        user_id: '',
        title: v.title,
        tag: v.tag,
        completed: false,
        recurring,
        scheduled_date: toToday && !recurring ? toDateStr(new Date(m.state.submittedAt || Date.now())) : undefined,
        created_at: new Date(m.state.submittedAt || Date.now()).toISOString(),
      }
    },
  })
  return useMemo(() => pending.filter((t): t is Task => t !== null).reverse(), [pending])
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

const updateTask = resumableMutation('updateTask', async ({ id, tag, title, recurring, scheduled_date, due_date, notes }: {
  id: string
  tag?: string
  title?: string
  recurring?: boolean
  scheduled_date?: string | null
  due_date?: string | null
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
  if (due_date !== undefined) updates.due_date = due_date
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
