import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { useAuth } from '../hooks/useAuth'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

function AuthGate() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/')
    }
  }, [user, loading, segments])

  return <Slot />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  )
}
