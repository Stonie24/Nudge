import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { supabase } from './supabase'

WebBrowser.maybeCompleteAuthSession()

// One redirect target for every OAuth provider — the `nudge://` scheme on
// native (opens the app directly), the page's own origin on web. Must be
// added to the Supabase project's Auth > URL Configuration redirect allowlist.
const redirectTo = AuthSession.makeRedirectUri({ path: 'auth/callback' })

export type OAuthProvider = 'google' | 'apple'

/**
 * Parses the tokens Supabase appends to a redirect URL and turns them into
 * an active session. Safe to call with any URL — it's a no-op if there's
 * no access_token present (e.g. the app was opened by an unrelated link).
 */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  if (errorCode) throw new Error(errorCode)

  const { access_token, refresh_token } = params
  if (!access_token) return null

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) throw error
  return data.session
}

/**
 * Kicks off the OAuth flow for the given provider: opens the provider's
 * consent screen in an in-app browser tab, then exchanges the redirect
 * back into a Supabase session. Works the same way on native and web.
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })
  if (error) throw error
  if (!data?.url) throw new Error('No OAuth URL returned from Supabase')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type === 'success' && result.url) {
    return createSessionFromUrl(result.url)
  }
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return null
  }
  throw new Error('OAuth sign-in did not complete')
}
