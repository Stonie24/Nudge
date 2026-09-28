import { useState } from 'react'
import { Alert } from 'react-native'
import { signInWithOAuth, type OAuthProvider } from '../lib/oauth'

export function useOAuthSignIn() {
  const [loading, setLoading] = useState(false)

  async function signIn(provider: OAuthProvider) {
    setLoading(true)
    try {
      await signInWithOAuth(provider)
      // on success, _layout.tsx AuthGate redirects to onboarding/tabs
    } catch (err) {
      Alert.alert('Google sign-in failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, signIn }
}
