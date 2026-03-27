import { Alert, Platform } from 'react-native'

/**
 * Cross-platform alert that works on web (window.alert / window.confirm)
 * and falls back to React Native Alert on iOS/Android.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[]
) {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length <= 1) {
      window.alert(message ? `${title}\n\n${message}` : title)
      buttons?.[0]?.onPress?.()
      return
    }

    // Find the confirm (destructive/default) button and the cancel button
    const confirmBtn = buttons.find(b => b.style !== 'cancel')
    const cancelBtn = buttons.find(b => b.style === 'cancel')

    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title)
    if (confirmed) {
      confirmBtn?.onPress?.()
    } else {
      cancelBtn?.onPress?.()
    }
  } else {
    Alert.alert(title, message, buttons)
  }
}