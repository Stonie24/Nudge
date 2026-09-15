import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { queryClient, persistOptions } from '../lib/queryClient'
import { setupOnlineManager } from '../lib/network'
import { useAuth } from '../hooks/useAuth'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import { OfflineBanner } from '../components/OfflineBanner'

WebBrowser.maybeCompleteAuthSession()
setupOnlineManager()

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
      <OfflineBanner />
      <Slot />
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
        onSuccess={() => queryClient.resumePausedMutations()}
      >
        <ThemeProvider>
          <AuthGate />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  )
}
