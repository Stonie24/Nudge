import type { MutationFunction, MutationKey } from '@tanstack/react-query'
import { queryClient } from './queryClient'

/**
 * A mutation restored from persisted storage (after a force-quit while a
 * write was paused offline) only carries its serializable state — not the
 * original `mutationFn` closure — so `resumePausedMutations()` can't run it
 * unless a default mutationFn is registered for its `mutationKey` ahead of
 * time. Wrap any mutation a user might trigger while offline with this so
 * `useMutation({ ...resumableMutation('addTask', fn) })` works both live and
 * after the app is restarted with the write still queued.
 */
export function resumableMutation<TData, TVariables>(
  key: string,
  mutationFn: MutationFunction<TData, TVariables>,
  options: { scope?: { id: string } } = {}
) {
  const mutationKey: MutationKey = [key]
  queryClient.setMutationDefaults(mutationKey, { mutationFn, ...options })
  return { mutationKey, mutationFn, ...options }
}

/**
 * Shared scope for every write that touches a task row (or a row pointing at
 * one, like daily_completions). Mutations in one scope run strictly in order —
 * including queued offline writes replayed after reconnect — so a task that is
 * still being created can be completed, tagged, edited or deleted right away
 * without that write reaching Supabase before the insert does.
 */
export const taskWriteScope = { scope: { id: 'task-writes' } }
