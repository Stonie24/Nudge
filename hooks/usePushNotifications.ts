import { useState, useEffect, useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

export type NudgeTime = '08:00' | '12:00' | '18:00' | '21:00'

export type NotificationPrefs = {
  enabled: boolean
  time: NudgeTime
}

export const NUDGE_TIME_LABELS: Record<NudgeTime, string> = {
  '08:00': 'Morning · 8 AM',
  '12:00': 'Noon · 12 PM',
  '18:00': 'Evening · 6 PM',
  '21:00': 'Night · 9 PM',
}

const DEFAULT_PREFS: NotificationPrefs = { enabled: false, time: '08:00' }
const NUDGE_IDENTIFIER = 'daily-nudge'

export const supportsNotifications = Platform.OS !== 'web'

async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

async function scheduleDaily(time: NudgeTime) {
  const [hour, minute] = time.split(':').map(Number)
  await Notifications.cancelScheduledNotificationAsync(NUDGE_IDENTIFIER).catch(() => {})
  await Notifications.scheduleNotificationAsync({
    identifier: NUDGE_IDENTIFIER,
    content: {
      title: 'Nudge',
      body: "Time to check your daily board ·",
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  })
}

async function cancelScheduled() {
  await Notifications.cancelScheduledNotificationAsync(NUDGE_IDENTIFIER).catch(() => {})
}

export function useNudgeNotifications() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const meta = user.user_metadata ?? {}
      setPrefs({
        enabled: meta.notifications_enabled === true,
        time: (meta.notification_time as NudgeTime) ?? DEFAULT_PREFS.time,
      })
      setLoading(false)
    }
    load()
  }, [])

  const persist = useCallback(async (next: NotificationPrefs) => {
    setPrefs(next)
    const { error } = await supabase.auth.updateUser({
      data: { notifications_enabled: next.enabled, notification_time: next.time },
    })
    if (error) console.warn('Failed to save notification prefs:', error.message)
  }, [])

  const enable = useCallback(async (time: NudgeTime) => {
    if (!supportsNotifications) return
    const granted = await requestPermission()
    if (!granted) return
    await scheduleDaily(time)
    await persist({ enabled: true, time })
  }, [persist])

  const disable = useCallback(async () => {
    await cancelScheduled()
    await persist({ ...prefs, enabled: false })
  }, [persist, prefs])

  const changeTime = useCallback(async (time: NudgeTime) => {
    if (prefs.enabled && supportsNotifications) await scheduleDaily(time)
    await persist({ enabled: prefs.enabled, time })
  }, [persist, prefs.enabled])

  return { prefs, loading, enable, disable, changeTime }
}
