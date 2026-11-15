import React, { useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, ActivityIndicator, StyleSheet, View } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import Svg, { Path } from 'react-native-svg'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'
import { APPLE_SIGN_IN_ENABLED, canUseNativeAppleSignIn, isAppleSignInAvailable } from '../lib/appleAuth'
import type { Colors } from '../lib/theme'
import { radius } from '../lib/theme'

const HEIGHT = 52

/**
 * "Continue with Apple". On iPhone this is Apple's own native button (always
 * within Apple's design rules); on web and Android it's a matching black
 * button that starts the browser sign-in. Same size as the Google button.
 * Renders nothing unless EXPO_PUBLIC_APPLE_SIGN_IN=true.
 */
export function AppleSignInButton({
  loading,
  disabled,
  onPress,
}: {
  loading: boolean
  disabled?: boolean
  onPress: () => void
}) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark])
  const native = canUseNativeAppleSignIn()
  const [nativeAvailable, setNativeAvailable] = useState<boolean | null>(native ? null : false)

  useEffect(() => {
    if (native && APPLE_SIGN_IN_ENABLED) isAppleSignInAvailable().then(setNativeAvailable)
  }, [native])

  // Hidden until Apple sign-in is set up (see lib/appleAuth.ts).
  if (!APPLE_SIGN_IN_ENABLED) return null
  // iOS older than 13 has no Sign in with Apple: show nothing rather than a dead button.
  if (native && nativeAvailable === false) return null
  if (native && nativeAvailable === null) return <View style={{ height: HEIGHT }} />

  if (loading) {
    return (
      <View style={[styles.button, styles.center]}>
        <ActivityIndicator color={styles.text.color as string} />
      </View>
    )
  }

  if (native) {
    return (
      <View pointerEvents={disabled ? 'none' : 'auto'} style={disabled ? styles.disabled : undefined}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={HEIGHT / 2}
          style={{ width: '100%', height: HEIGHT }}
          onPress={onPress}
        />
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.center, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Continue with Apple"
    >
      <Svg width={16} height={19} viewBox="0 0 17 20">
        <Path
          fill={styles.text.color as string}
          d="M14.06 10.62c-.02-2.24 1.83-3.32 1.91-3.37-1.04-1.53-2.66-1.74-3.24-1.76-1.38-.14-2.69.81-3.39.81-.7 0-1.78-.79-2.92-.77-1.5.02-2.89.87-3.66 2.22-1.56 2.71-.4 6.72 1.12 8.92.75 1.08 1.63 2.29 2.79 2.25 1.12-.04 1.54-.72 2.9-.72 1.35 0 1.73.72 2.92.7 1.21-.02 1.97-1.1 2.71-2.18.85-1.25 1.2-2.46 1.22-2.52-.03-.01-2.34-.9-2.36-3.58zM11.84 4.03c.62-.75 1.04-1.79.92-2.83-.89.04-1.97.6-2.61 1.34-.57.66-1.08 1.72-.94 2.73.99.08 2.01-.5 2.63-1.24z"
        />
      </Svg>
      <Text style={styles.text}>Continue with Apple</Text>
    </TouchableOpacity>
  )
}

function createStyles(c: Colors, isDark: boolean) {
  // Apple's rules: a black button on light backgrounds, a white one on dark.
  const bg = isDark ? '#FFFFFF' : '#000000'
  const fg = isDark ? '#000000' : '#FFFFFF'
  return StyleSheet.create({
    button: { height: HEIGHT, borderRadius: radius.pill, backgroundColor: bg, flexDirection: 'row', gap: 8 },
    center: { alignItems: 'center', justifyContent: 'center' },
    text: { color: fg, fontSize: 15, fontWeight: '600' },
    disabled: { opacity: 0.6 },
  })
}
