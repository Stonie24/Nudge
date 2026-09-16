import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'

let initialized = false

export function setupOnlineManager() {
  if (initialized) return
  initialized = true

  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false)
    })
  })
}
