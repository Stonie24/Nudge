import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Banner } from './Banner'
import { useTheme } from '../lib/ThemeContext'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import type { Colors } from '../lib/theme'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top])

  if (isOnline) return null

  return (
    <Banner
      message="You're offline — changes will sync when you're back online"
      containerStyle={styles.banner}
      textStyle={styles.text}
    />
  )
}

function createStyles(colors: Colors, topInset: number) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.surfaceAlt,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: topInset + 6,
      paddingBottom: 6,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    text: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
  })
}
