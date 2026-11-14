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
} from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { TagPicker } from './TagPicker'
import { ChecklistSection } from './ChecklistSection'
import { useCompleteTask, useUncompleteTask, useUpdateTask } from '../hooks/useTasks'
import { useCompleteRecurring, useUncompleteRecurring } from '../hooks/useToday'
import { useTheme } from '../lib/ThemeContext'
import { useUndoDelete } from '../lib/UndoDeleteContext'
import { showAlert } from '../lib/alert'
import type { Colors } from '../lib/theme'
import { space, radius, shadow } from '../lib/theme'
import type { Task, ChecklistItem } from '../types'
import { toDateStr, addDays, parseDateStr, getDueInfo } from '../lib/dueDate'

// How many upcoming days the due-date strip offers (no native date picker needed).
const DUE_STRIP_DAYS = 21

function boardDateLabel(scheduledDate: string): string {
  return parseDateStr(scheduledDate).toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })
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
  // scheduled_date: the day the task sits on the Today board.
  const [boardDate, setBoardDate] = useState<string | undefined>()
  // due_date: the deadline, independent of when it's on the board.
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const completeTask = useCompleteTask()
  const uncompleteTask = useUncompleteTask()
  const completeRecurring = useCompleteRecurring()
  const uncompleteRecurring = useUncompleteRecurring()
  const updateTask = useUpdateTask()
  const { requestDelete } = useUndoDelete()

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setTag(task.tag)
    setRecurring(task.recurring)
    setBoardDate(task.scheduled_date)
    setDueDate(task.due_date ?? null)
    setNotes(task.notes ?? '')
    // Only when a different task opens: the same task re-renders whenever a
    // change to it lands (e.g. each checklist tick, which saves at once), and
    // resetting then would wipe unsaved edits to the other fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id])

  if (!task) return null

  const isDone = task.recurring ? !!completedToday : task.completed
  const today = toDateStr(new Date())
  const tomorrow = addDays(today, 1)
  const dueInfo = getDueInfo(dueDate, { done: isDone, today })

  const dirty =
    title.trim() !== task.title ||
    tag !== task.tag ||
    recurring !== task.recurring ||
    boardDate !== task.scheduled_date ||
    dueDate !== (task.due_date ?? null) ||
    notes !== (task.notes ?? '')

  function handleToggleDone() {
    if (!task) return
    if (task.recurring) {
      isDone ? uncompleteRecurring.mutate(task.id) : completeRecurring.mutate(task.id)
    } else {
      isDone ? uncompleteTask.mutate(task.id) : completeTask.mutate(task.id)
    }
  }

  // Checklist changes save immediately (not via "Save changes"), so ticks are
  // kept even if the sheet is dismissed. Shown at once via usePendingEdits.
  function saveChecklist(next: ChecklistItem[]) {
    if (!task) return
    updateTask.mutate(
      { id: task.id, tag: task.tag, checklist: next }, // tag is always written; keep the saved one
      { onError: () => showAlert("Couldn't save checklist", 'Your last checklist change wasn\'t saved. Please try again.') }
    )
  }

  function handleSave() {
    if (!task || !title.trim()) return
    // Don't wait for the server: the change shows everywhere at once (see
    // usePendingEdits) and is queued while offline, so close right away.
    const savedTitle = title.trim()
    updateTask.mutate({
      id: task.id,
      title: title.trim(),
      tag,
      recurring,
      scheduled_date: recurring ? null : (boardDate ?? null),
      due_date: recurring ? null : dueDate,
      notes,
    }, {
      onError: () => showAlert("Couldn't save changes", `Your changes to "${savedTitle}" weren't saved. Please try again.`),
    })
    onClose()
  }

  function handleDelete() {
    if (!task) return
    requestDelete(task)
    onClose()
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

            {/* Repeating tasks have no checklist for now: items would need a daily reset. */}
            {!recurring && (
              <View style={styles.field}>
                <ChecklistSection items={task.checklist ?? []} onChange={saveChecklist} />
              </View>
            )}

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
                <Text style={styles.fieldHint}>Repeating tasks don't have a due date</Text>
              ) : (
                <>
                  <View style={styles.dueDateRow}>
                    {[
                      { label: 'Today', value: today },
                      { label: 'Tomorrow', value: tomorrow },
                      { label: 'In a week', value: addDays(today, 7) },
                      { label: 'None', value: null },
                    ].map(opt => {
                      const active = dueDate === opt.value
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.dueChip, active && styles.dueChipActive]}
                          onPress={() => setDueDate(opt.value)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`Due ${opt.label.toLowerCase()}`}
                        >
                          <Text style={[styles.dueChipText, active && styles.dueChipTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayStrip}
                    keyboardShouldPersistTaps="handled"
                  >
                    {Array.from({ length: DUE_STRIP_DAYS }, (_, i) => addDays(today, i)).map(day => {
                      const d = parseDateStr(day)
                      const active = dueDate === day
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayCell, active && styles.dayCellActive]}
                          onPress={() => setDueDate(day)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={d.toLocaleDateString('en-SE', { weekday: 'long', month: 'long', day: 'numeric' })}
                        >
                          <Text style={[styles.dayCellWeekday, active && styles.dayCellTextActive]}>
                            {d.toLocaleDateString('en-SE', { weekday: 'short' })}
                          </Text>
                          <Text style={[styles.dayCellNumber, active && styles.dayCellTextActive]}>{d.getDate()}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                  {dueInfo && (
                    <Text style={[styles.fieldHint, dueInfo.tone === 'overdue' && styles.fieldHintDanger]}>
                      {dueInfo.label}
                    </Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>On my board</Text>
              {recurring ? (
                <Text style={styles.fieldHint}>Repeating tasks are on the board every day</Text>
              ) : (
                <View style={styles.dueDateRow}>
                  <TouchableOpacity
                    style={[styles.dueChip, boardDate === today && styles.dueChipActive]}
                    onPress={() => setBoardDate(today)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, boardDate === today && styles.dueChipTextActive]}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dueChip, boardDate === tomorrow && styles.dueChipActive]}
                    onPress={() => setBoardDate(tomorrow)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, boardDate === tomorrow && styles.dueChipTextActive]}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dueChip, !boardDate && styles.dueChipActive]}
                    onPress={() => setBoardDate(undefined)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dueChipText, !boardDate && styles.dueChipTextActive]}>Backlog</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!recurring && boardDate && boardDate !== today && boardDate !== tomorrow && (
                <Text style={styles.fieldHint}>On the board {boardDateLabel(boardDate)}</Text>
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
              disabled={!title.trim() || !dirty}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Save changes</Text>
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
      flexWrap: 'wrap',
      gap: space.sm,
    },
    fieldHintDanger: { color: c.danger, fontWeight: '600' },
    dayStrip: { gap: space.xs, paddingVertical: space.sm },
    dayCell: {
      width: 44,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      gap: 2,
    },
    dayCellActive: { backgroundColor: c.btnPrimary, borderColor: c.btnPrimary },
    dayCellWeekday: { fontSize: 10, color: c.textMuted, fontWeight: '500', textTransform: 'uppercase' },
    dayCellNumber: { fontSize: 15, color: c.text, fontWeight: '600' },
    dayCellTextActive: { color: c.btnPrimaryText },
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
