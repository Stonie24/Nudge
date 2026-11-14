import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { useTheme } from '../lib/ThemeContext'
import { getDueInfo, type DueTone } from '../lib/dueDate'
import type { Colors } from '../lib/theme'
import { space } from '../lib/theme'
import type { Task } from '../types'

/** Small "Due Fri" / "Overdue · 2d" label for a task row or card. Renders nothing without a due date. */
export function DueBadge({ task, done }: { task: Pick<Task, 'due_date' | 'recurring'>; done: boolean }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  if (task.recurring) return null
  const info = getDueInfo(task.due_date, { done })
  if (!info) return null
  const color = toneColor(info.tone, colors)
  return (
    <View
      style={styles.badge}
      accessibilityLabel={info.tone === 'overdue' ? `${info.label.replace('·', '').replace(/(\d+)d$/, '$1 days')}` : info.label}
    >
      <Icon name="calendar" size={11} color={color} strokeWidth={2} />
      <Text style={[styles.text, { color }, info.tone === 'overdue' && styles.textStrong]}>{info.label}</Text>
    </View>
  )
}

function toneColor(tone: DueTone, c: Colors): string {
  switch (tone) {
    case 'overdue': return c.danger
    case 'today': return c.accent
    case 'soon': return c.textSecondary
    default: return c.textMuted
  }
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    text: { fontSize: 11, fontWeight: '500', color: c.textMuted },
    textStrong: { fontWeight: '600' },
  })
}
