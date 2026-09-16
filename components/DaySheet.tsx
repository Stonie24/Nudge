import React, { useState, useMemo } from 'react'
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native'
import { AppText as Text } from './AppText'
import { useAddEvent, useDeleteEvent } from '../hooks/useCalendar'
import { useCompleteTask, useUncompleteTask } from '../hooks/useTasks'
import { useCompleteRecurring, useUncompleteRecurring } from '../hooks/useToday'
import { useTheme } from '../lib/ThemeContext'
import { TagBadge } from './TagPicker'
import { showAlert } from '../lib/alert'
import type { Colors } from '../lib/theme'
import { space, radius, shadow } from '../lib/theme'
import { displayFont } from '../lib/fonts'
import type { CalendarEvent, Task } from '../types'

function EventRow({
  event,
  onDelete,
}: {
  event: CalendarEvent
  onDelete?: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const sourceIcon = event.source === 'google' ? 'G' : event.source === 'apple' ? '' : '◆'

  return (
    <TouchableOpacity
      style={styles.eventRow}
      onLongPress={event.source === 'nudge' ? onDelete : undefined}
      activeOpacity={0.8}
    >
      <View style={[styles.eventBar, { backgroundColor: event.color }]} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {!event.all_day && (
          <Text style={styles.eventTime}>
            {new Date(event.start_time).toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {new Date(event.end_time).toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {event.all_day && <Text style={styles.eventTime}>All day</Text>}
      </View>
      <View style={[styles.sourceTag, { backgroundColor: event.color + '22' }]}>
        <Text style={[styles.sourceText, { color: event.color }]}>{sourceIcon}</Text>
      </View>
    </TouchableOpacity>
  )
}

function TaskRow({
  task,
  completedToday,
  onComplete,
  onUncomplete,
}: {
  task: Task
  completedToday: boolean
  onComplete: () => void
  onUncomplete: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isDone = task.recurring ? completedToday : task.completed
  return (
    <TouchableOpacity
      style={styles.taskRow}
      onPress={() => isDone ? onUncomplete() : onComplete()}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
        {isDone && <View style={styles.checkmark} />}
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
          {task.title}
        </Text>
        {task.tag && <TagBadge tag={task.tag} />}
      </View>
      {task.recurring && <Text style={styles.recurringBadge}>↻</Text>}
    </TouchableOpacity>
  )
}

function AddEventForm({
  date,
  onClose,
}: {
  date: string
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [allDay, setAllDay] = useState(false)
  const addEvent = useAddEvent()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  async function handleAdd() {
    if (!title.trim()) return
    const start = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`
    const end = allDay ? `${date}T23:59:59` : `${date}T${endTime}:00`
    await addEvent.mutateAsync({
      title: title.trim(),
      start_time: start,
      end_time: end,
      all_day: allDay,
      color: colors.calendarDotEvent,
    })
    onClose()
  }

  return (
    <View style={styles.addForm}>
      <Text style={styles.addFormTitle}>New event</Text>
      <TextInput
        style={styles.input}
        placeholder="Event title"
        placeholderTextColor={colors.placeholder}
        value={title}
        onChangeText={setTitle}
        autoFocus
      />
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.timeLabel}>Start</Text>
          <TextInput
            style={[styles.input, styles.timeInput]}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
            placeholderTextColor={colors.placeholder}
            editable={!allDay}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={styles.timeLabel}>End</Text>
          <TextInput
            style={[styles.input, styles.timeInput]}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="10:00"
            placeholderTextColor={colors.placeholder}
            editable={!allDay}
          />
        </View>
        <TouchableOpacity
          style={[styles.allDayBtn, allDay && styles.allDayBtnActive]}
          onPress={() => setAllDay(!allDay)}
          activeOpacity={0.7}
        >
          <Text style={[styles.allDayText, allDay && styles.allDayTextActive]}>All day</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
          onPress={handleAdd}
          disabled={!title.trim() || addEvent.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export function DaySheet({
  visible,
  date,
  events,
  tasks,
  completedTodayIds,
  onClose,
}: {
  visible: boolean
  date: string
  events: CalendarEvent[]
  tasks: Task[]
  completedTodayIds: Set<string>
  onClose: () => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const deleteEvent = useDeleteEvent()
  const completeTask = useCompleteTask()
  const uncompleteTask = useUncompleteTask()
  const completeRecurring = useCompleteRecurring()
  const uncompleteRecurring = useUncompleteRecurring()

  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('en-SE', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const allDayEvents = events.filter(e => e.all_day)
  const timedEvents = events.filter(e => !e.all_day)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  function handleDeleteEvent(event: CalendarEvent) {
    showAlert('Delete event', `Remove "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEvent.mutate(event.id) },
    ])
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{formatted}</Text>
            <TouchableOpacity
              style={styles.addEventBtn}
              onPress={() => setShowAddForm(!showAddForm)}
              activeOpacity={0.7}
            >
              <Text style={styles.addEventBtnText}>{showAddForm ? '✕' : '+ Event'}</Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <AddEventForm date={date} onClose={() => setShowAddForm(false)} />
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {allDayEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>All day</Text>
                {allDayEvents.map(e => (
                  <EventRow key={e.id} event={e} onDelete={() => handleDeleteEvent(e)} />
                ))}
              </View>
            )}

            {timedEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Events</Text>
                {timedEvents.map(e => (
                  <EventRow key={e.id} event={e} onDelete={() => handleDeleteEvent(e)} />
                ))}
              </View>
            )}

            {tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Tasks & habits</Text>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    completedToday={completedTodayIds.has(task.id)}
                    onComplete={() => task.recurring
                      ? completeRecurring.mutate(task.id)
                      : completeTask.mutate(task.id)
                    }
                    onUncomplete={() => task.recurring
                      ? uncompleteRecurring.mutate(task.id)
                      : uncompleteTask.mutate(task.id)
                    }
                  />
                ))}
              </View>
            )}

            {events.length === 0 && tasks.length === 0 && !showAddForm && (
              <Text style={styles.emptyText}>Nothing on this day yet.</Text>
            )}
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
      paddingBottom: 48,
      maxHeight: '85%',
      ...shadow.lg,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center', marginBottom: space.xl,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: space.xl,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
      fontFamily: displayFont.semibold,
    },
    addEventBtn: {
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
      backgroundColor: c.accentBg,
      borderRadius: radius.pill,
    },
    addEventBtnText: {
      fontSize: 13,
      color: c.accentText,
      fontWeight: '500',
    },
    scroll: { maxHeight: 500 },
    section: { marginBottom: space.xxl },
    sectionLabel: {
      fontSize: 11, fontWeight: '600', color: c.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: space.sm,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.borderLight,
    },
    eventBar: {
      width: 3,
      height: 36,
      borderRadius: 2,
    },
    eventContent: { flex: 1 },
    eventTitle: { fontSize: 14, color: c.text, fontWeight: '500' },
    eventTime: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    sourceTag: {
      width: 24, height: 24, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    sourceText: { fontSize: 11, fontWeight: '700' },
    taskRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: space.md, borderBottomWidth: 1,
      borderBottomColor: c.borderLight, gap: space.md,
    },
    checkbox: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 1.5, borderColor: c.textFaint,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxDone: { backgroundColor: c.accent, borderColor: c.accent },
    checkmark: {
      width: 5, height: 9, borderRightWidth: 2,
      borderBottomWidth: 2, borderColor: '#FFFFFF',
      transform: [{ rotate: '40deg' }, { translateY: -1 }],
    },
    taskContent: { flex: 1, gap: space.xs },
    taskTitle: { fontSize: 14, color: c.text },
    taskTitleDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    recurringBadge: { fontSize: 14, color: c.accent },
    addForm: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.lg,
      marginBottom: space.xl,
      gap: space.md,
      ...shadow.sm,
    },
    addFormTitle: { fontSize: 15, fontWeight: '600', color: c.text },
    input: {
      height: 44, backgroundColor: c.inputBg,
      borderWidth: 1, borderColor: c.border,
      borderRadius: radius.sm, paddingHorizontal: space.md,
      fontSize: 14, color: c.text,
    },
    timeRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
    timeField: { flex: 1, gap: space.xs },
    timeLabel: { fontSize: 11, color: c.textMuted, fontWeight: '500' },
    timeInput: { textAlign: 'center' },
    allDayBtn: {
      height: 44, paddingHorizontal: space.md,
      borderRadius: radius.sm, borderWidth: 1,
      borderColor: c.border, alignItems: 'center', justifyContent: 'center',
    },
    allDayBtnActive: { backgroundColor: c.accentBg, borderColor: c.accentBorder },
    allDayText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
    allDayTextActive: { color: c.accentText },
    formActions: { flexDirection: 'row', gap: space.sm },
    cancelBtn: {
      flex: 1, height: 44, borderRadius: radius.pill,
      borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    cancelBtnText: { fontSize: 14, color: c.textSecondary },
    saveBtn: {
      flex: 1, height: 44, borderRadius: radius.pill,
      backgroundColor: c.btnPrimary,
      alignItems: 'center', justifyContent: 'center',
    },
    saveBtnDisabled: { backgroundColor: c.btnDisabled },
    saveBtnText: { fontSize: 14, color: c.btnPrimaryText, fontWeight: '500' },
    emptyText: {
      fontSize: 14, color: c.textMuted,
      textAlign: 'center', marginTop: space.xxl,
    },
  })
}
