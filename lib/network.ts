import { Platform } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'

let initialized = false

export function setupOnlineManager() {
  if (initialized) return
  initialized = true

  onlineManager.setEventListener((setOnline) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false)
    })

    // On web, NetInfo listens only to `navigator.connection` 'change' events in
    // browsers that have that API (Chrome, Edge), and ignores the window's
    // 'online' / 'offline' events there. If Chrome drops a connection without
    // firing 'change', the app would think it's still online. So on those
    // events, ask NetInfo to re-check: it stays the single source of truth and
    // notifies the listener above.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const recheck = () => { NetInfo.refresh() }
      window.addEventListener('online', recheck)
      window.addEventListener('offline', recheck)
      return () => {
        unsubscribe()
        window.removeEventListener('online', recheck)
        window.removeEventListener('offline', recheck)
      }
    }

    return unsubscribe
  })
}
