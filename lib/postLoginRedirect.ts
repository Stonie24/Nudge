import { Platform } from 'react-native'

/**
 * Where to go after signing in, when a public page sent the person to log in
 * (e.g. /delete-account → sign in → Settings). Only known in-app paths are
 * accepted, so this can't be used to send someone somewhere unexpected.
 *
 * On web it's also kept in sessionStorage, because signing in with Google or
 * Apple there leaves the page and comes back with a full reload.
 */
const ALLOWED = new Set(['/settings'])
const KEY = 'nudge.postLoginRedirect'
let pending: string | null = null

function storage(): Storage | null {
  if (Platform.OS !== 'web') return null
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export function setPostLoginRedirect(path: string) {
  if (!ALLOWED.has(path)) return
  pending = path
  try { storage()?.setItem(KEY, path) } catch {}
}

/** Returns the saved path once, then forgets it. */
export function consumePostLoginRedirect(): string | null {
  let p = pending
  pending = null
  try {
    const s = storage()
    p = p ?? s?.getItem(KEY) ?? null
    s?.removeItem(KEY)
  } catch {}
  return p && ALLOWED.has(p) ? p : null
}
