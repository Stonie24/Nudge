import React, { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { getTagColor } from '../lib/tagColor'
import { useTheme } from '../lib/ThemeContext'
import { TagPicker } from './TagPicker'
import { showAlert } from '../lib/alert'
import type { Colors } from '../lib/theme'
import type { Task } from '../types'

function KanbanCard({
  task,
  onComplete,
  onUncomplete,
  onDelete,
  onUpdateTag,
}: {
  task: Task
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTag?: (id: string, tag?: string) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  function handleLongPress() {
    showAlert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
    ])
  }

  return (
    <TouchableOpacity
      style={[styles.card, task.completed && styles.cardDone]}
      onPress={() => task.completed ? onUncomplete(task.id) : onComplete(task.id)}
      onLongPress={handleLongPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          {task.completed && <View style={styles.checkmark} />}
        </View>
        <Text style={[styles.cardTitle, task.completed && styles.cardTitleDone]}>
          {task.title}
        </Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardDate}>
          {new Date(task.created_at).toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })}
        </Text>
        {onUpdateTag && (
          <TagPicker
            value={task.tag}
            onChange={tag => onUpdateTag(task.id, tag)}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

export function KanbanBoard({
  tasks,
  onComplete,
  onUncomplete,
  onDelete,
  onUpdateTag,
}: {
  tasks: Task[]
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTag?: (id: string, tag?: string) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const groups: Record<string, Task[]> = {}
  for (const task of tasks) {
    const key = task.tag ?? 'No tag'
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  }

  const columns = Object.entries(groups)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.board}
    >
      {columns.map(([tag, colTasks]) => {
        const color = tag !== 'No tag' ? getTagColor(tag) : null
        const done = colTasks.filter(t => t.completed).length
        const total = colTasks.length

        return (
          <View key={tag} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={[
                styles.columnTag,
                color ? { backgroundColor: color.bg, borderColor: color.border } : styles.columnTagDefault,
              ]}>
                <Text style={[styles.columnTagText, color ? { color: color.text } : styles.columnTagTextDefault]}>
                  {tag}
                </Text>
              </View>
              <Text style={styles.columnCount}>{done}/{total}</Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: total > 0 ? `${(done / total) * 100}%` : '0%',
                    backgroundColor: color ? color.border : colors.textFaint,
                  },
                ]}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cards}
            >
              {colTasks.map(task => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onUncomplete={onUncomplete}
                  onDelete={onDelete}
                  onUpdateTag={onUpdateTag}
                />
              ))}
            </ScrollView>
          </View>
        )
      })}
    </ScrollView>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    board: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      gap: 16,
      alignItems: 'flex-start',
    },
    column: {
      width: 260,
      backgroundColor: c.surfaceMuted,
      borderRadius: 16,
      padding: 16,
      minHeight: 200,
    },
    columnHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    columnTag: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 100,
      borderWidth: 1.5,
    },
    columnTagDefault: {
      backgroundColor: c.surfaceAlt,
      borderColor: c.border,
    },
    columnTagText: {
      fontSize: 13,
      fontWeight: '600',
    },
    columnTagTextDefault: {
      color: c.textSecondary,
    },
    columnCount: {
      fontSize: 12,
      color: c.textMuted,
      fontWeight: '400',
    },
    progressBar: {
      height: 3,
      backgroundColor: c.border,
      borderRadius: 2,
      marginBottom: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    cards: {
      gap: 8,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 10,
    },
    cardDone: {
      opacity: 0.6,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.textFaint,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxDone: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    checkmark: {
      width: 5,
      height: 9,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#FFFFFF',
      transform: [{ rotate: '40deg' }, { translateY: -1 }],
    },
    cardTitle: {
      fontSize: 14,
      color: c.text,
      flex: 1,
      lineHeight: 20,
    },
    cardTitleDone: {
      color: c.textMuted,
      textDecorationLine: 'line-through',
    },
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardDate: {
      fontSize: 11,
      color: c.textMuted,
    },
  })
}
