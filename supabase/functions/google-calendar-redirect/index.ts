// Redirect bounce for the Google Calendar connect flow on iOS/Android.
//
// Google only accepts http(s) redirect URIs for a Web OAuth client, so it
// can't send the user straight back to the app's `nudge://` scheme. Google
// redirects here instead, and this forwards the browser, with the same query
// string (code, state, or error), to nudge://calendar-callback, where
// expo-web-browser's auth session picks it up.
//
// It does nothing else: the app exchanges the code itself via
// google-token-exchange. The code is useless without the PKCE verifier that
// only the app holds. verify_jwt is off because Google's redirect carries no
// Supabase JWT.

const APP_REDIRECT = 'nudge://calendar-callback'

Deno.serve((req) => {
  const { search } = new URL(req.url)
  return new Response(null, {
    status: 302,
    headers: { Location: `${APP_REDIRECT}${search}`, 'Cache-Control': 'no-store' },
  })
})
