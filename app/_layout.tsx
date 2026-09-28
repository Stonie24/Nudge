import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import { queryClient, persistOptions } from '../lib/queryClient'
import { setupOnlineManager } from '../lib/network'
import { useAuth } from '../hooks/useAuth'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'
import { fontsToLoad } from '../lib/fonts'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import * as Notifications from 'expo-notifications'
import * as Linking from 'expo-linking'
import { Platform } from 'react-native'
import { OfflineBanner } from '../components/OfflineBanner'
import { createSessionFromUrl } from '../lib/oauth'

WebBrowser.maybeCompleteAuthSession()
setupOnlineManager()

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
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

  // Some OAuth flows (notably Android, where the browser can close before
  // WebBrowser.openAuthSessionAsync's promise resolves) return to the app
  // via a Linking event instead. Catch that case here so the session still
  // gets created.
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      createSessionFromUrl(url).catch((err) => console.error('OAuth session error:', err))
    })
    return () => sub.remove()
  }, [])

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Slot />
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontsToLoad)

  if (!fontsLoaded) return null

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
