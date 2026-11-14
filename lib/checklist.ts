import type { ChecklistItem, Task } from '../types'

/** Client-generated id for a new checklist item (unique within its task). */
export function newChecklistItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** "2/5"-style progress, or null when the task has no checklist. */
export function checklistProgress(task: Pick<Task, 'checklist'>): { done: number; total: number } | null {
  const items = task.checklist ?? []
  if (items.length === 0) return null
  return { done: items.filter(i => i.done).length, total: items.length }
}

export function addItem(items: ChecklistItem[], title: string): ChecklistItem[] {
  return [...items, { id: newChecklistItemId(), title, done: false }]
}

export function toggleItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.map(i => (i.id === id ? { ...i, done: !i.done } : i))
}

export function removeItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.filter(i => i.id !== id)
}

export function renameItem(items: ChecklistItem[], id: string, title: string): ChecklistItem[] {
  return items.map(i => (i.id === id ? { ...i, title } : i))
}
