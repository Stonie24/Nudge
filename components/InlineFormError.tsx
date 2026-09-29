import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'

export function InlineFormError({ message }: { message?: string | null }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!message) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    banner: {
      backgroundColor: c.dangerBg,
      borderRadius: radius.md,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
    },
    text: {
      fontSize: 13,
      fontWeight: '500',
      color: c.danger,
      lineHeight: 18,
    },
  })
}
