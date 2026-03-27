import { useEffect, useRef } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { Platform } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

const REDIRECT_URI = Platform.OS === 'web'
  ? 'http://localhost:8081'
  : 'https://auth.expo.io/@stonie24/nudge'

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

export function useGoogleCalendarAuth() {
  const queryClient = useQueryClient()
  const codeVerifierRef = useRef<string | undefined>()

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      extraParams: { access_type: 'offline', prompt: 'consent' },
      usePKCE: true,
    },
    discovery
  )

  // Store code verifier when request is ready
  useEffect(() => {
    if (request?.codeVerifier) {
      codeVerifierRef.current = request.codeVerifier
    }
  }, [request])

  const { data: token, isLoading } = useQuery({
    queryKey: ['google_token'],
    queryFn: async () => {
      const { data } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .single()
      return data ?? null
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { error } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google_token'] }),
  })

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      exchangeCode(response.params.code)
    }
  }, [response])

  async function exchangeCode(code: string) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-token-exchange`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifierRef.current,
          }),
        }
      )
      const data = await res.json()
      if (data.access_token) {
        await saveToken.mutateAsync({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + data.expires_in * 1000,
        })
      } else {
        console.error('Token exchange failed:', data)
      }
    } catch (e) {
      console.error('Token exchange error:', e)
    }
  }

  return {
    isConnected: !!token,
    isLoading,
    connect: () => promptAsync(),
    disconnect: () => disconnect.mutate(),
    accessToken: token?.access_token,
  }
}