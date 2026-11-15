import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'

/** Gentle amber note on a habit you've been slipping on, e.g. "Missed 2 of the last 3 days". */
export function HabitRiskBadge({ label }: { label: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.badge} accessibilityLabel={`Habit at risk: ${label}`}>
      <Icon name="bell" size={11} color={colors.warning} strokeWidth={2} />
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    text: { fontSize: 11, fontWeight: '600', color: c.warning, flexShrink: 1 },
  })
}
