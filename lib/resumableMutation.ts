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
  mutationFn: MutationFunction<TData, TVariables>
) {
  const mutationKey: MutationKey = [key]
  queryClient.setMutationDefaults(mutationKey, { mutationFn })
  return { mutationKey, mutationFn }
}
