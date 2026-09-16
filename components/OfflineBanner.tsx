import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline — changes will sync when you're back online</Text>
    </View>
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
