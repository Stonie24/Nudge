import type { AuthError } from '@supabase/supabase-js'

// Supabase's AuthError.message is meant for logs, not end users, and its
// `code` field has changed across SDK versions — so we match on both and
// fall back to the raw message if nothing known matches. The codes below
// are each only ever returned by one specific auth call (e.g.
// `user_already_exists` only from signUp, `invalid_credentials` only from
// signInWithPassword), so there's no need to scope the checks by caller.
export function getAuthErrorMessage(error: AuthError | Error): string {
  const code = (error as { code?: string }).code
  const msg = error.message.toLowerCase()

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the confirmation link.'
  }
  if (
    code === 'user_already_exists' ||
    msg.includes('already registered') ||
    msg.includes('already exists')
  ) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (code === 'weak_password' || (msg.includes('password') && msg.includes('weak'))) {
    return 'That password is too weak. Please choose a stronger one.'
  }
  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
    return "You've tried too many times. Please wait a bit and try again."
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }

  return error.message
}
