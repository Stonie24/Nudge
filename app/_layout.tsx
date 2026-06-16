import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { useAuth } from '../hooks/useAuth'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  })
}

function AuthGate() {
  const { user, loading, needsOnboarding } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const { isDark } = useTheme()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    const inOnboardingGroup = segments[0] === '(onboarding)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && needsOnboarding && !inOnboardingGroup) {
      router.replace('/(onboarding)/')
    } else if (user && !needsOnboarding && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/')
    }
  }, [user, loading, needsOnboarding]) // segments intentionally omitted — we only want to react to auth changes

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
    </>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthGate />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
