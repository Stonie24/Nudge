import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'

/**
 * Turns a failed `supabase.functions.invoke` into a message a person can act
 * on, instead of a generic "Something went wrong". Reads the status code and
 * the function's `{ error }` body where there is one.
 */
export async function describeFunctionError(error: unknown, action: string): Promise<string> {
  if (error instanceof FunctionsFetchError) {
    return `Couldn't reach the server. Check your connection and try again.`
  }
  if (error instanceof FunctionsRelayError) {
    return `The ${action} service isn't available right now. Please try again later.`
  }
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response | undefined
    const status = res?.status
    let serverMessage = ''
    try { serverMessage = (await res?.clone().json())?.error ?? '' } catch { /* not JSON */ }
    console.warn(`${action} failed:`, status, serverMessage)
    if (status === 401) return 'Your session has expired. Sign out and back in, then try again.'
    if (status === 403) return `This app isn't allowed to ${action} right now.`
    if (status === 404) return `The ${action} service isn't set up yet.`
    if (serverMessage === 'Service misconfigured') return `The ${action} service isn't set up on the server yet.`
    if (status === 502) return `Couldn't ${action} right now: the service behind it didn't respond. Please try again later.`
    return `Couldn't ${action} (error ${status ?? 'unknown'}). Please try again.`
  }
  return 'Something went wrong. Please try again.'
}
