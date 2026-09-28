import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Platform, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { createSessionFromUrl } from '../../lib/oauth'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../lib/ThemeContext'

// Landing spot for the OAuth redirect. Lives inside the (auth) route group
// so AuthGate (app/_layout.tsx) treats it as a valid unauthenticated screen
// instead of bouncing back to /login while the token exchange is still in
// flight — and, once the session lands, AuthGate is also what redirects
// onward to onboarding/tabs, rather than this screen racing it with its own
// router.replace. A timeout is the only local fallback, for the case where
// the exchange never completes and the user would otherwise be stuck here.
export default function AuthCallback() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      createSessionFromUrl(window.location.href).catch((err) => {
        console.error('OAuth callback error:', err)
      })
      return
    }
    // Native: the redirect is normally already being handled by
    // app/_layout.tsx's Linking listener/getInitialURL call by the time this
    // screen mounts. Read the launch URL here too in case this screen won,
    // the race — createSessionFromUrl's dedup guard makes it a safe no-op
    // if the other path already processed the same tokens.
    Linking.getInitialURL().then((url) => {
      if (url) createSessionFromUrl(url).catch((err) => console.error('OAuth callback error:', err))
    })
  }, [])

  useEffect(() => {
    if (user) return
    const timer = setTimeout(() => setTimedOut(true), 15000)
    return () => clearTimeout(timer)
  }, [user])

  useEffect(() => {
    if (timedOut && !user) {
      Alert.alert('Sign-in failed', "We couldn't finish signing you in. Please try again.")
      router.replace('/(auth)/login')
    }
  }, [timedOut, user])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.text} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
