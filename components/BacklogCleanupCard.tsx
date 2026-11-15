import React, { useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { TagBadge } from './TagPicker'
import { useTheme } from '../lib/ThemeContext'
import { useUndoDelete } from '../lib/UndoDeleteContext'
import { useScheduleForToday } from '../hooks/useToday'
import { getStaleTasks, keepUntil } from '../lib/backlog'
import { toDateStr } from '../lib/dueDate'
import { showAlert } from '../lib/alert'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'
import type { Task } from '../types'

// "Keep" choices: task id → date until which it's not asked about again (this device).
const KEPT_KEY = 'nudge:kept-backlog'

/** "Still want to do these?": old, undated backlog tasks with Add to today / Delete / Keep. */
export function BacklogCleanupCard({ tasks }: { tasks: readonly Task[] | undefined }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { requestDelete, hiddenTaskIds } = useUndoDelete()
  const scheduleForToday = useScheduleForToday()
  const [keptUntil, setKeptUntil] = useState<Record<string, string>>({})
  const today = toDateStr(new Date())

  useEffect(() => {
    AsyncStorage.getItem(KEPT_KEY)
      .then(raw => { if (raw) setKeptUntil(JSON.parse(raw)) })
      .catch(() => {})
  }, [])

  const stale = useMemo(
    () => getStaleTasks(tasks?.filter(t => !hiddenTaskIds.has(t.id)), { today, keptUntil }),
    [tasks, hiddenTaskIds, today, keptUntil]
  )
  if (stale.length === 0) return null

  function keep(task: Task) {
    setKeptUntil(prev => {
      // Drop expired entries while we're at it, so the stored map stays small.
      const next = Object.fromEntries(Object.entries(prev).filter(([, until]) => until >= today))
      next[task.id] = keepUntil(today)
      AsyncStorage.setItem(KEPT_KEY, JSON.stringify(next)).catch(() => {})
      return next
    })
  }

  function addToToday(task: Task) {
    scheduleForToday.mutate(task.id, {
      onError: () => showAlert("Couldn't add task", `"${task.title}" wasn't added to today. Please try again.`),
    })
  }

  return (
    <View style={styles.card} accessibilityLabel="Still want to do these?">
      <Text style={styles.title}>Still want to do these?</Text>
      <Text style={styles.subtitle}>They've been in your backlog for a while with no date.</Text>
      {stale.map(({ task, label }) => (
        <View key={task.id} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={2}>{task.title}</Text>
            <View style={styles.meta}>
              <Text style={styles.age}>{label}</Text>
              {task.tag && <TagBadge tag={task.tag} />}
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.addBtn} onPress={() => addToToday(task)} accessibilityRole="button" accessibilityLabel={`Add ${task.title} to today`}>
              <Icon name="plus" size={13} color={colors.btnPrimaryText} strokeWidth={2.4} />
              <Text style={styles.addBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => keep(task)} accessibilityRole="button" accessibilityLabel={`Keep ${task.title} for now`}>
              <Text style={styles.ghostText}>Keep</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => requestDelete(task)} accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
              <Icon name="trash" size={15} color={colors.danger} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg,
      paddingHorizontal: space.lg, paddingVertical: space.md, marginBottom: space.lg, gap: space.xs,
    },
    title: { fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
    subtitle: { fontSize: 12, color: c.textMuted, marginBottom: space.xs },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap',
      paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: c.borderLight,
    },
    rowText: { flex: 1, minWidth: 140, gap: 2 },
    rowTitle: { fontSize: 15, color: c.text, lineHeight: 21 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
    age: { fontSize: 12, color: c.textSecondary },
    actions: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.btnPrimary,
      borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md,
    },
    addBtnText: { color: c.btnPrimaryText, fontSize: 13, fontWeight: '600' },
    ghostBtn: { borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, paddingVertical: 5, paddingHorizontal: space.md },
    ghostText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    iconBtn: { padding: space.xs },
  })
}
