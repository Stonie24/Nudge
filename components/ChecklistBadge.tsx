import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { useTheme } from '../lib/ThemeContext'
import { checklistProgress } from '../lib/checklist'
import type { Colors } from '../lib/theme'
import { space } from '../lib/theme'
import type { Task } from '../types'

/** "☑ 2/5" checklist progress for a task row or card. Renders nothing without a checklist. */
export function ChecklistBadge({ task }: { task: Pick<Task, 'checklist' | 'recurring'> }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  if (task.recurring) return null
  const progress = checklistProgress(task)
  if (!progress) return null
  const complete = progress.done === progress.total
  const color = complete ? colors.accent : colors.textSecondary
  return (
    <View
      style={styles.badge}
      accessibilityLabel={`Checklist: ${progress.done} of ${progress.total} done`}
    >
      <Icon name="check" size={11} color={color} strokeWidth={2.4} />
      <Text style={[styles.text, { color }]}>{progress.done}/{progress.total}</Text>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    text: { fontSize: 11, fontWeight: '600', color: c.textSecondary, fontVariant: ['tabular-nums'] },
  })
}
