import { useState } from 'react'
import { signInWithOAuth, type OAuthProvider } from '../lib/oauth'
import { getAuthErrorMessage } from '../lib/authErrors'

// Takes the screen's own error setter so a Google sign-in failure lands in
// the same inline banner as a password sign-in/signup failure, rather than
// keeping a second error state that callers have to merge and clear in sync.
export function useOAuthSignIn(setError: (message: string | null) => void) {
  const [loading, setLoading] = useState(false)

  async function signIn(provider: OAuthProvider) {
    setLoading(true)
    setError(null)
    try {
      await signInWithOAuth(provider)
      // on success, _layout.tsx AuthGate redirects to onboarding/tabs
    } catch (err) {
      setError(err instanceof Error ? getAuthErrorMessage(err) : 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, signIn }
}
