import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

WebBrowser.maybeCompleteAuthSession()

// One redirect target for every OAuth provider — the `nudge://` scheme on
// native (opens the app directly), the page's own origin on web. Lives at
// app/(auth)/callback.tsx so it's part of the (auth) route group and the
// AuthGate in app/_layout.tsx treats it as a valid unauthenticated screen.
// Must be added to the Supabase project's Auth > URL Configuration redirect
// allowlist.
const redirectTo = AuthSession.makeRedirectUri({ path: 'callback' })

export type OAuthProvider = 'google'

// The same redirect URL can reach createSessionFromUrl from more than one
// place at once — the direct call below, the Linking listener in
// app/_layout.tsx, and app/(auth)/callback.tsx on web all race for the same
// event on some platforms (Android in particular can fire both a Linking
// 'url' event and resolve WebBrowser.openAuthSessionAsync's promise for one
// redirect). These two module-level guards make repeat calls for the same
// tokens safe: an in-flight call is shared rather than duplicated, and a
// token that's already been exchanged is a no-op instead of a second
// (failing) setSession call.
let inFlight: Promise<Session | null> | null = null
let lastHandledAccessToken: string | null = null

/**
 * Parses the tokens Supabase appends to a redirect URL and turns them into
 * an active session. Safe to call repeatedly, concurrently, or with any URL
 * — it's a no-op if there's no token present (e.g. the app was opened by an
 * unrelated link) or if this exact token was already exchanged.
 */
export async function createSessionFromUrl(url: string): Promise<Session | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  if (errorCode) throw new Error(errorCode)

  const { access_token, refresh_token } = params
  if (!access_token || !refresh_token) return null
  if (access_token === lastHandledAccessToken) return null
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (error) throw error
      lastHandledAccessToken = access_token
      return data.session
    } finally {
      inFlight = null
    }
  })()

  return inFlight
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
