import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { getTagColor } from '../lib/tagColor'
import { TagPicker } from './TagPicker'
import { showAlert } from '../lib/alert'
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
                    backgroundColor: color ? color.border : '#D6D3D1',
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

const styles = StyleSheet.create({
  board: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
    alignItems: 'flex-start',
  },
  column: {
    width: 260,
    backgroundColor: '#F5F3EF',
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
    backgroundColor: '#F1EFE8',
    borderColor: '#D3D1C7',
  },
  columnTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  columnTagTextDefault: {
    color: '#78716C',
  },
  columnCount: {
    fontSize: 12,
    color: '#A8A29E',
    fontWeight: '400',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E7E5E4',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
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
    borderColor: '#D6D3D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: '#639922',
    borderColor: '#639922',
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
    color: '#1C1917',
    flex: 1,
    lineHeight: 20,
  },
  cardTitleDone: {
    color: '#A8A29E',
    textDecorationLine: 'line-through',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 11,
    color: '#A8A29E',
  },
})