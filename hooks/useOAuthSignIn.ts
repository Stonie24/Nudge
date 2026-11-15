import { useState } from 'react'
import { signInWithOAuth, type OAuthProvider } from '../lib/oauth'
import { getAuthErrorMessage } from '../lib/authErrors'

// Takes the screen's own error setter so a Google/Apple sign-in failure lands in
// the same inline banner as a password sign-in/signup failure, rather than
// keeping a second error state that callers have to merge and clear in sync.
export function useOAuthSignIn(setError: (message: string | null) => void) {
  // Which provider is signing in, so only that button shows a spinner.
  const [loading, setLoading] = useState<OAuthProvider | null>(null)

  async function signIn(provider: OAuthProvider) {
    setLoading(provider)
    setError(null)
    try {
      await signInWithOAuth(provider)
      // on success, _layout.tsx AuthGate redirects to onboarding/tabs
    } catch (err) {
      const name = provider === 'apple' ? 'Apple' : 'Google'
      setError(err instanceof Error ? getAuthErrorMessage(err) : `${name} sign-in failed. Please try again.`)
    } finally {
      setLoading(null)
    }
  }

  return { loading, signIn }
}
