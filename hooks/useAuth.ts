import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { queryClient, persister } from '../lib/queryClient'
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

  const signOut = async () => {
    await supabase.auth.signOut()
    // Prevent the next account on this device from seeing (or resuming
    // offline mutations into) this account's cached tasks/tags/tokens.
    queryClient.clear()
    await persister.removeClient()
  }

  const needsOnboarding = user !== null && user.user_metadata?.onboarding_completed !== true

  return { user, loading, signOut, needsOnboarding }
}
