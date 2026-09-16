import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { TagPicker } from './TagPicker'
import { useCompleteTask, useUncompleteTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { useCompleteRecurring, useUncompleteRecurring } from '../hooks/useToday'
import { useTheme } from '../lib/ThemeContext'
import { showAlert } from '../lib/alert'
import type { Colors } from '../lib/theme'
import { space, radius, shadow } from '../lib/theme'
import type { Task } from '../types'

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dueDateLabel(scheduledDate: string | undefined): string {
  if (!scheduledDate) return 'No due date'
  const today = toDateStr(new Date())
  const tomorrow = toDateStr(new Date(Date.now() + 86400000))
  if (scheduledDate === today) return 'Today'
  if (scheduledDate === tomorrow) return 'Tomorrow'
  return new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })
}

export function TaskDetailSheet({
  task,
  completedToday,
  onClose,
}: {
  task: Task | null
  /** Only meaningful when task.recurring — whether it's been completed today. */
  completedToday?: boolean
  onClose: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [title, setTitle] = useState('')
  const [tag, setTag] = useState<string | undefined>()
  const [recurring, setRecurring] = useState(false)
  const [dueDate, setDueDate] = useState<string | undefined>()
  const [notes, setNotes] = useState('')

  const completeTask = useCompleteTask()
  const uncompleteTask = useUncompleteTask()
  const completeRecurring = useCompleteRecurring()
  const uncompleteRecurring = useUncompleteRecurring()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setTag(task.tag)
    setRecurring(task.recurring)
    setDueDate(task.scheduled_date)
    setNotes(task.notes ?? '')
  }, [task])

  if (!task) return null

  const isDone = task.recurring ? !!completedToday : task.completed
  const today = toDateStr(new Date())
  const tomorrow = toDateStr(new Date(Date.now() + 86400000))

  const dirty =
    title.trim() !== task.title ||
    tag !== task.tag ||
    recurring !== task.recurring ||
    dueDate !== task.scheduled_date ||
    notes !== (task.notes ?? '')

  function handleToggleDone() {
    if (!task) return
    if (task.recurring) {
      isDone ? uncompleteRecurring.mutate(task.id) : completeRecurring.mutate(task.id)
    } else {
      isDone ? uncompleteTask.mutate(task.id) : completeTask.mutate(task.id)
    }
  }

  async function handleSave() {
    if (!task || !title.trim()) return
    await updateTask.mutateAsync({
      id: task.id,
      title: title.trim(),
      tag,
      recurring,
      scheduled_date: recurring ? null : (dueDate ?? null),
      notes,
    })
    onClose()
  }

  function handleDelete() {
    if (!task) return
    showAlert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask.mutateAsync(task.id)
          onClose()
        },
      },
    ])
  }

  return (
    <Modal visible={!!task} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.titleRow}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                multiline
                placeholder="Task title"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <TouchableOpacity
              style={[styles.doneBtn, isDone && styles.doneBtnActive]}
              onPress={handleToggleDone}
              activeOpacity={0.75}
            >
              <Icon
                name="check"
                size={16}
                color={isDone ? colors.btnPrimaryText : colors.accent}
                strokeWidth={2.2}
              />
              <Text style={[styles.doneBtnText, isDone && styles.doneBtnTextActive]}>
                {isDone ? 'Marked done' : 'Mark done'}
              </Text>
            </TouchableOpacity>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tag</Text>
              <TagPicker value={tag} onChange={setTag} />
            </View>

            <View style={styles.field}>
              <View style={styles.repeatRow}>
                <View style={styles.repeatLabel}>
                  <Text style={styles.fieldLabel}>Repeat</Text>
                  <Text style={styles.fieldHint}>Resets every day at midnight</Text>
                </View>
                <Switch
                  value={recurring}
                  onValueChange={setRecurring}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Due date</Text>
              {recurring ? (
                <Text style={styles.fieldHint}>Repeating tasks don't need a due date</Text>
              ) : (
                <View style={styles.dueDateRow}>
                  <TouchableOpacity
                    style={[styles.dueChip, dueDate === today && styles.dueChipActive]}
                    onPress={() => setDueDate(today)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, dueDate === today && styles.dueChipTextActive]}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dueChip, dueDate === tomorrow && styles.dueChipActive]}
                    onPress={() => setDueDate(tomorrow)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, dueDate === tomorrow && styles.dueChipTextActive]}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dueChip, !dueDate && styles.dueChipActive]}
                    onPress={() => setDueDate(undefined)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, !dueDate && styles.dueChipTextActive]}>None</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!recurring && dueDate && dueDate !== today && dueDate !== tomorrow && (
                <Text style={styles.fieldHint}>Due {dueDateLabel(dueDate)}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add details..."
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (!title.trim() || !dirty) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim() || !dirty || updateTask.isPending}
              activeOpacity={0.85}
            >
              {updateTask.isPending
                ? <ActivityIndicator color={colors.btnPrimaryText} />
                : <Text style={styles.saveBtnText}>Save changes</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
              <Icon name="trash" size={14} color={colors.danger} strokeWidth={1.8} />
              <Text style={styles.deleteBtnText}>Delete task</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      padding: space.xxl,
      paddingBottom: 40,
      maxHeight: '88%',
      ...shadow.lg,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: space.xl,
    },
    titleRow: {
      marginBottom: space.lg,
    },
    titleInput: {
      fontSize: 20,
      fontWeight: '600',
      color: c.text,
      padding: 0,
    },
    doneBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.accentBorder,
      backgroundColor: c.accentBg,
      marginBottom: space.xl,
    },
    doneBtnActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    doneBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.accentText,
    },
    doneBtnTextActive: {
      color: c.btnPrimaryText,
    },
    field: {
      marginBottom: space.xl,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: space.sm,
    },
    fieldHint: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: space.xs,
    },
    repeatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    repeatLabel: {
      flex: 1,
    },
    dueDateRow: {
      flexDirection: 'row',
      gap: space.sm,
    },
    dueChip: {
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    dueChipActive: {
      backgroundColor: c.accentBg,
      borderColor: c.accentBorder,
    },
    dueChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
    },
    dueChipTextActive: {
      color: c.accentText,
    },
    notesInput: {
      minHeight: 90,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      fontSize: 14,
      color: c.text,
    },
    saveBtn: {
      height: 52,
      backgroundColor: c.btnPrimary,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.md,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: c.btnPrimaryText,
      fontSize: 15,
      fontWeight: '500',
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      paddingVertical: space.sm,
    },
    deleteBtnText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.danger,
    },
  })
}
