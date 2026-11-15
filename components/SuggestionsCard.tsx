import React, { useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { TagBadge } from './TagPicker'
import { useTheme } from '../lib/ThemeContext'
import type { Suggestion } from '../lib/suggestions'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'
import type { Task } from '../types'

/** "Suggested for today": overdue, left-over and due-soon backlog tasks, one tap to add. */
export function SuggestionsCard({
  suggestions,
  onAdd,
  onAddAll,
  onDismiss,
  room,
}: {
  suggestions: Suggestion[]
  /** Slots left today by your usual pace (null when not known yet). */
  room?: number | null
  onAdd: (task: Task) => void
  onAddAll: () => void
  onDismiss: (task: Task) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  if (suggestions.length === 0) return null

  return (
    <View style={styles.card} accessibilityLabel="Suggested for today">
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Suggested for today</Text>
          {room !== null && room !== undefined && (
            <Text style={styles.room}>
              {room === 0 ? 'Your day looks full, so only overdue tasks' : `Room for ${room} more, based on your usual pace`}
            </Text>
          )}
        </View>
        {suggestions.length > 1 && (
          <TouchableOpacity onPress={onAddAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button">
            <Text style={styles.addAll}>Add all</Text>
          </TouchableOpacity>
        )}
      </View>

      {suggestions.map(({ task, reason, label }, i) => (
        <View key={task.id} style={[styles.row, i > 0 && styles.rowDivider]}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={2}>{task.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.reasonWrap}>
                {reason === 'rhythm' && <Icon name="repeat" size={11} color={colors.accent} strokeWidth={2} />}
                <Text style={[styles.reason, reason === 'overdue' && styles.reasonOverdue, reason === 'rhythm' && styles.reasonRhythm]}>{label}</Text>
              </View>
              {task.tag && <TagBadge tag={task.tag} />}
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAdd(task)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Add ${task.title} to today`}
          >
            <Icon name="plus" size={14} color={colors.btnPrimaryText} strokeWidth={2.4} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => onDismiss(task)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Hide suggestion ${task.title} for today`}
          >
            <Icon name="close" size={12} color={colors.textMuted} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      marginBottom: space.xxl,
    },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: space.xs,
    },
    titleWrap: { flex: 1, minWidth: 0, gap: 2 },
    room: { fontSize: 12, color: c.textMuted },
    title: {
      fontSize: 11, fontWeight: '600', color: c.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    addAll: { fontSize: 13, fontWeight: '600', color: c.accent },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
    rowDivider: { borderTopWidth: 1, borderTopColor: c.borderLight },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontSize: 15, color: c.text, lineHeight: 21 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
    reason: { fontSize: 12, color: c.textSecondary, fontWeight: '500', flexShrink: 1 },
    reasonOverdue: { color: c.danger, fontWeight: '600' },
    reasonRhythm: { color: c.accentText },
    // Icon and reason stay on one line; the text wraps beside the icon.
    reasonWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.btnPrimary, borderRadius: radius.pill,
      paddingVertical: 6, paddingHorizontal: space.md,
    },
    addBtnText: { color: c.btnPrimaryText, fontSize: 13, fontWeight: '600' },
    dismissBtn: { padding: space.xs },
  })
}
