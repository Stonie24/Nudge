import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'

const DAY = 1000 * 60 * 60 * 24

// Queries that must never be written to on-device storage in plaintext.
const SENSITIVE_QUERY_KEYS = new Set(['google_token'])

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,    // 1 minute
      gcTime: DAY,             // keep cached data around for offline viewing
      retry: 1,
    },
    mutations: {
      gcTime: DAY,             // keep paused offline mutations queued long enough to resync
    },
  },
})

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'nudge-query-cache',
})

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: DAY,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) &&
      !SENSITIVE_QUERY_KEYS.has(String(query.queryKey[0])),
  },
}
