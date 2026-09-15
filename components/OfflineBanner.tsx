import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../lib/ThemeContext'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import type { Colors } from '../lib/theme'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (isOnline) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline — changes will sync when you're back online</Text>
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.surfaceAlt,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 6,
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
