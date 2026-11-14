import { useMemo } from 'react'
import { useMutationState } from '@tanstack/react-query'
import { toDateStr } from '../lib/dueDate'
import type { Task } from '../types'

// Edits (rename, tag, dates, notes, checklist, "put on today") that are in flight or
// queued offline, including writes restored after a restart. Read straight
// from the mutation cache, like usePendingTicks, so the UI shows them at once
// and a background refetch can't revert them before the write lands.

type Edit = Partial<Pick<Task, 'title' | 'tag' | 'recurring' | 'scheduled_date' | 'due_date' | 'notes' | 'checklist'>>
export type PendingEdits = ReadonlyMap<string, Edit>

type UpdateVars = {
  id: string
  tag?: string
  title?: string
  recurring?: boolean
  scheduled_date?: string | null
  due_date?: string | null
  notes?: string
  checklist?: Task['checklist']
}

const EDIT_KEYS = new Set(['updateTask', 'scheduleForToday'])

export function usePendingEdits(): PendingEdits {
  const pending = useMutationState({
    filters: { status: 'pending', predicate: m => EDIT_KEYS.has(String(m.options.mutationKey?.[0])) },
    select: m => ({ key: String(m.options.mutationKey?.[0]), vars: m.state.variables as unknown }),
  })

  return useMemo(() => {
    const today = toDateStr(new Date())
    const edits = new Map<string, Edit>()
    // Mutation cache order is submission order, so later edits win.
    for (const { key, vars } of pending) {
      if (key === 'scheduleForToday') {
        if (typeof vars !== 'string') continue
        edits.set(vars, { ...edits.get(vars), scheduled_date: today })
        continue
      }
      const v = vars as UpdateVars | undefined
      if (!v?.id) continue
      // Mirrors the updateTask write: tag is always written; the rest only when provided.
      const edit: Edit = { tag: v.tag ?? undefined }
      if (v.title !== undefined) edit.title = v.title
      if (v.recurring !== undefined) edit.recurring = v.recurring
      if (v.scheduled_date !== undefined) edit.scheduled_date = v.scheduled_date ?? undefined
      if (v.due_date !== undefined) edit.due_date = v.due_date
      if (v.notes !== undefined) edit.notes = v.notes || undefined
      if (v.checklist !== undefined) edit.checklist = v.checklist
      edits.set(v.id, { ...edits.get(v.id), ...edit })
    }
    return edits
  }, [pending])
}

/** Apply pending edits to a task list (returns the same array if nothing changes). */
export function applyTaskEdits<T extends Task[] | undefined>(list: T, edits: PendingEdits): T {
  if (!list || edits.size === 0) return list
  let changed = false
  const next = list.map(t => {
    const edit = edits.get(t.id)
    if (!edit) return t
    changed = true
    return { ...t, ...edit }
  })
  return (changed ? next : list) as T
}

/**
 * Apply pending edits to today's board: edit fields in place, drop tasks whose
 * board day moved off today, and add tasks moved onto today (taken from the
 * all-tasks cache, since today's server list doesn't have them yet).
 */
export function applyTodayEdits(
  list: Task[] | undefined,
  edits: PendingEdits,
  today: string,
  allTasks: readonly Task[] | undefined
): Task[] | undefined {
  if (!list || edits.size === 0) return list
  const onToday = (t: Task) => t.recurring || t.scheduled_date === today
  const edited = applyTaskEdits(list, edits)
  let next = edited.filter(onToday)
  const ids = new Set(next.map(t => t.id))
  for (const [id, edit] of edits) {
    if (ids.has(id) || edit.scheduled_date !== today) continue
    const source = allTasks?.find(t => t.id === id)
    if (source) next = [...next, { ...source, ...edit }]
  }
  return next.length === list.length && next.every((t, i) => t === list[i]) ? list : next
}
