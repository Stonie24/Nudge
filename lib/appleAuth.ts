import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

/**
 * Off until Apple is set up (Apple Developer account + Supabase provider).
 * Turn on by setting EXPO_PUBLIC_APPLE_SIGN_IN=true in .env, and as a GitHub
 * Actions variable for EAS Updates. Read literally so Expo bakes it into the bundle.
 */
export const APPLE_SIGN_IN_ENABLED = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'true'

/**
 * Native Sign in with Apple (iOS only). Apple's own sheet, with Face ID and
 * "Hide My Email". Web and Android use the regular OAuth redirect in
 * lib/oauth.ts instead.
 */
export function canUseNativeAppleSignIn(): boolean {
  return Platform.OS === 'ios'
}

/** Whether this device supports Sign in with Apple (iOS 13+). */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (!canUseNativeAppleSignIn()) return false
  try {
    return await AppleAuthentication.isAvailableAsync()
  } catch {
    return false
  }
}

/**
 * Shows Apple's sign-in sheet and exchanges the result for a Supabase
 * session. Returns null if the person cancels.
 *
 * Replay protection: Apple signs a SHA-256 hash of a one-time random value
 * (the nonce) into its identity token, and Supabase checks it against the
 * raw value we send, so a token can't be reused elsewhere.
 */
export async function signInWithAppleNative(): Promise<Session | null> {
  const rawNonce = Crypto.randomUUID()
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce)

  let credential: AppleAuthentication.AppleAuthenticationCredential
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    })
  } catch (err) {
    // The person closed Apple's sheet: not an error.
    if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return null
    throw err
  }

  if (!credential.identityToken) throw new Error('Apple sign-in did not return an identity token')

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  })
  if (error) throw error

  // Apple shares the person's name only on their very first sign-in, and it
  // isn't inside the token, so save it to the profile while we have it.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ')
  if (name && !data.user?.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: name } }).catch(() => {})
  }
  return data.session
}
