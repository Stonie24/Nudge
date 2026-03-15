import * as WebBrowser from 'expo-web-browser'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const REDIRECT_URI = 'https://auth.expo.io/@stonie24/nudge'

export function useGoogleCalendarAuth() {
  const queryClient = useQueryClient()

  const { data: token, isLoading } = useQuery({
    queryKey: ['google_token'],
    queryFn: async () => {
      const { data } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .single()
      return data
    },
  })

  const saveToken = useMutation({
    mutationFn: async ({ access_token, refresh_token, expires_at }: {
      access_token: string
      refresh_token?: string
      expires_at?: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { error } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: user.id,
          access_token,
          refresh_token,
          expires_at,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google_token'] }),
  })

  const disconnect = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('google_calendar_tokens').delete()
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google_token'] }),
  })

  async function exchangeCode(code: string) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }).toString(),
      })
      const data = await res.json()
      console.log('Token response:', data)
      if (data.access_token) {
        await saveToken.mutateAsync({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + data.expires_in * 1000,
        })
      } else {
        console.error('No access token in response:', data)
      }
    } catch (e) {
      console.error('Token exchange failed:', e)
    }
  }

  async function connect() {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent',
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI)
    console.log('Auth result:', result)

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url)
      const code = url.searchParams.get('code')
      if (code) {
        await exchangeCode(code)
      } else {
        console.error('No code in redirect URL:', result.url)
      }
    }
  }

  return {
    isConnected: !!token,
    isLoading,
    connect,
    disconnect: () => disconnect.mutate(),
    accessToken: token?.access_token,
  }
}