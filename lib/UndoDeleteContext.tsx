import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteTask } from '../hooks/useTasks'
import { UndoToast } from '../components/UndoToast'
import type { Task } from '../types'

// How long the "Task deleted · Undo" toast stays up before the delete is
// actually sent to Supabase.
export const UNDO_WINDOW_MS = 5000

type UndoDeleteContextValue = {
  /** Hide the task immediately and delete it for real once the undo window passes. */
  requestDelete: (task: Task) => void
  /**
   * Ids hidden by a pending/in-flight delete. Lists built from somewhere other
   * than the ['tasks'] cache (e.g. Today's not-yet-saved adds) filter by this.
   */
  hiddenTaskIds: ReadonlySet<string>
}

const UndoDeleteContext = createContext<UndoDeleteContextValue>({
  requestDelete: () => {},
  hiddenTaskIds: new Set(),
})

/** Remove a task from every cached `['tasks', ...]` list. */
export function stripTask(list: unknown, id: string) {
  if (!Array.isArray(list) || !list.some((t: Task) => t?.id === id)) return list
  return list.filter((t: Task) => t?.id !== id)
}

/** Put a task back at the position it was removed from. */
export function restoreTask(list: unknown, task: Task, index: number) {
  if (!Array.isArray(list) || list.some((t: Task) => t?.id === task.id)) return list
  const next = [...list]
  next.splice(Math.min(Math.max(index, 0), next.length), 0, task)
  return next
}

type Pending = {
  task: Task
  // Where the task sat in each cached list, so undo restores it in place
  // instead of jumping it to the top/bottom.
  positions: { key: readonly unknown[]; index: number }[]
  timer: ReturnType<typeof setTimeout>
}

/**
 * Deferred delete with undo. Swiping (or deleting from the detail sheet /
 * kanban) hides the task from the cache right away, shows an undo toast, and
 * only fires the real `deleteTask` mutation once the toast expires — so undo
 * never needs to re-insert a row on the server.
 */
export function UndoDeleteProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { mutate: mutateDelete } = useDeleteTask()
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  // Ids that must stay hidden even if a refetch brings them back — covers
  // both the undo window and the time the real delete is in flight / queued
  // offline.
  const hiddenIds = useRef(new Set<string>())
  const [hiddenTaskIds, setHiddenTaskIds] = useState<ReadonlySet<string>>(() => new Set())
  const syncHidden = useCallback(() => setHiddenTaskIds(new Set(hiddenIds.current)), [])

  const setPendingBoth = useCallback((p: Pending | null) => {
    pendingRef.current = p
    setPending(p)
  }, [])

  const commit = useCallback((p: Pending) => {
    clearTimeout(p.timer)
    if (pendingRef.current?.task.id === p.task.id) setPendingBoth(null)
    mutateDelete(p.task.id, {
      onSettled: () => { hiddenIds.current.delete(p.task.id); syncHidden() },
      onError: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    })
  }, [mutateDelete, queryClient, setPendingBoth, syncHidden])

  const requestDelete = useCallback((task: Task) => {
    // Only one undo at a time: a second delete commits the first.
    if (pendingRef.current) commit(pendingRef.current)

    queryClient.cancelQueries({ queryKey: ['tasks'] })
    const positions = queryClient
      .getQueriesData<Task[]>({ queryKey: ['tasks'] })
      .map(([key, data]) => ({
        key,
        index: Array.isArray(data) ? data.findIndex(t => t.id === task.id) : -1,
      }))
      .filter(p => p.index >= 0)

    hiddenIds.current.add(task.id)
    syncHidden()
    queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => stripTask(old, task.id))

    const p: Pending = {
      task,
      positions,
      timer: setTimeout(() => commit(p), UNDO_WINDOW_MS),
    }
    setPendingBoth(p)
  }, [commit, queryClient, setPendingBoth, syncHidden])

  const undo = useCallback(() => {
    const p = pendingRef.current
    if (!p) return
    clearTimeout(p.timer)
    hiddenIds.current.delete(p.task.id)
    syncHidden()
    for (const { key, index } of p.positions) {
      queryClient.setQueryData(key, (old: unknown) => restoreTask(old, p.task, index))
    }
    // A task deleted before its create was saved wasn't in any cached list.
    // If the create has landed since, a refetch is the only way back.
    if (p.positions.length === 0) queryClient.invalidateQueries({ queryKey: ['tasks'] })
    setPendingBoth(null)
  }, [queryClient, setPendingBoth, syncHidden])

  // Keep hidden tasks hidden if something refetches ['tasks'] during the
  // undo window (e.g. completing another task invalidates the list).
  useEffect(() => {
    return queryClient.getQueryCache().subscribe(event => {
      if (event.type !== 'updated' || event.action.type !== 'success') return
      if (event.query.queryKey[0] !== 'tasks' || hiddenIds.current.size === 0) return
      const data = event.query.state.data
      if (!Array.isArray(data)) return
      if (!data.some((t: Task) => hiddenIds.current.has(t?.id))) return
      event.query.setData(data.filter((t: Task) => !hiddenIds.current.has(t?.id)))
    })
  }, [queryClient])

  // Don't lose the delete if the app is backgrounded (and possibly killed)
  // mid-window — commit it so it gets queued like any other write.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active' && pendingRef.current) commit(pendingRef.current)
    })
    return () => sub.remove()
  }, [commit])

  const value = useMemo(() => ({ requestDelete, hiddenTaskIds }), [requestDelete, hiddenTaskIds])

  return (
    <UndoDeleteContext.Provider value={value}>
      {children}
      <UndoToast
        visible={!!pending}
        message={pending ? `Deleted "${pending.task.title}"` : ''}
        onUndo={undo}
      />
    </UndoDeleteContext.Provider>
  )
}

export function useUndoDelete() {
  return useContext(UndoDeleteContext)
}
