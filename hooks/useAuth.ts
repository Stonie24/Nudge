import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { onlineManager } from '@tanstack/react-query'
import { queryClient, persister } from '../lib/queryClient'
import { cancelScheduled as cancelNudgeReminder } from './usePushNotifications'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Prevent the next account on this device from seeing (or resuming
  // offline mutations into) this account's cached tasks/tags/tokens.
  const clearLocalData = async () => {
    queryClient.clear()
    await persister.removeClient()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    await clearLocalData()
  }

  /**
   * Permanently deletes the account and all its data (server-side, via the
   * delete-account edge function), then clears everything on this device.
   * Throws with a user-facing message if it couldn't be deleted; in that case
   * nothing has been signed out and the user can try again.
   */
  const deleteAccount = async () => {
    if (!onlineManager.isOnline()) {
      throw new Error("You're offline. Connect to the internet to delete your account.")
    }
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('delete-account', {
      body: { confirm: 'DELETE' },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    })
    if (error || data?.deleted !== true) {
      throw new Error("We couldn't delete your account. Please try again.")
    }
    await cancelNudgeReminder().catch(() => {}) // no-op on web / if none scheduled
    await clearLocalData()
    // The user no longer exists server-side, so only drop the local session.
    await supabase.auth.signOut({ scope: 'local' })
  }

  const needsOnboarding = user !== null && user.user_metadata?.onboarding_completed !== true

  return { user, loading, signOut, deleteAccount, needsOnboarding }
}
