import { useState } from 'react'
import { signInWithOAuth, type OAuthProvider } from '../lib/oauth'
import { getAuthErrorMessage } from '../lib/authErrors'

export function useOAuthSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(provider: OAuthProvider) {
    setLoading(true)
    setError(null)
    try {
      await signInWithOAuth(provider)
      // on success, _layout.tsx AuthGate redirects to onboarding/tabs
    } catch (err) {
      setError(
        err instanceof Error ? getAuthErrorMessage(err, 'oauth') : 'Google sign-in failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, clearError: () => setError(null), signIn }
}
