import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import { useAddEvent, useDeleteEvent } from '../hooks/useCalendar'
import { useCompleteTask, useUncompleteTask } from '../hooks/useTasks'
import { useCompleteRecurring, useUncompleteRecurring } from '../hooks/useToday'
import { TagBadge } from './TagPicker'
import type { CalendarEvent, Task } from '../types'

function EventRow({
  event,
  onDelete,
}: {
  event: CalendarEvent
  onDelete?: () => void
}) {
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

  async function handleAdd() {
    if (!title.trim()) return
    const start = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`
    const end = allDay ? `${date}T23:59:59` : `${date}T${endTime}:00`
    await addEvent.mutateAsync({
      title: title.trim(),
      start_time: start,
      end_time: end,
      all_day: allDay,
      color: '#F59F0A',
    })
    onClose()
  }

  return (
    <View style={styles.addForm}>
      <Text style={styles.addFormTitle}>New event</Text>
      <TextInput
        style={styles.input}
        placeholder="Event title"
        placeholderTextColor="#A8A29E"
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
            placeholderTextColor="#A8A29E"
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
            placeholderTextColor="#A8A29E"
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
    Alert.alert('Delete event', `Remove "${event.title}"?`, [
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
            {/* All day events */}
            {allDayEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>All day</Text>
                {allDayEvents.map(e => (
                  <EventRow key={e.id} event={e} onDelete={() => handleDeleteEvent(e)} />
                ))}
              </View>
            )}

            {/* Timed events */}
            {timedEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Events</Text>
                {timedEvents.map(e => (
                  <EventRow key={e.id} event={e} onDelete={() => handleDeleteEvent(e)} />
                ))}
              </View>
            )}

            {/* Tasks */}
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF8F4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E7E5E4',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1917',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  addEventBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#EAF3DE',
    borderRadius: 100,
  },
  addEventBtnText: {
    fontSize: 13,
    color: '#3B6D11',
    fontWeight: '500',
  },
  scroll: { maxHeight: 500 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#A8A29E',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3EF',
  },
  eventBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 14, color: '#1C1917', fontWeight: '500' },
  eventTime: { fontSize: 12, color: '#A8A29E', marginTop: 2 },
  sourceTag: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceText: { fontSize: 11, fontWeight: '700' },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: '#F5F3EF', gap: 12,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D6D3D1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#639922', borderColor: '#639922' },
  checkmark: {
    width: 5, height: 9, borderRightWidth: 2,
    borderBottomWidth: 2, borderColor: '#FFFFFF',
    transform: [{ rotate: '40deg' }, { translateY: -1 }],
  },
  taskContent: { flex: 1, gap: 3 },
  taskTitle: { fontSize: 14, color: '#1C1917' },
  taskTitleDone: { color: '#A8A29E', textDecorationLine: 'line-through' },
  recurringBadge: { fontSize: 14, color: '#F59F0A' },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  addFormTitle: { fontSize: 15, fontWeight: '600', color: '#1C1917' },
  input: {
    height: 44, backgroundColor: '#FAF8F4',
    borderWidth: 1, borderColor: '#E7E5E4',
    borderRadius: 10, paddingHorizontal: 14,
    fontSize: 14, color: '#1C1917',
  },
  timeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  timeField: { flex: 1, gap: 4 },
  timeLabel: { fontSize: 11, color: '#A8A29E', fontWeight: '500' },
  timeInput: { textAlign: 'center' },
  allDayBtn: {
    height: 44, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1,
    borderColor: '#E7E5E4', alignItems: 'center', justifyContent: 'center',
  },
  allDayBtnActive: { backgroundColor: '#EAF3DE', borderColor: '#639922' },
  allDayText: { fontSize: 12, color: '#78716C', fontWeight: '500' },
  allDayTextActive: { color: '#3B6D11' },
  formActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: 100,
    borderWidth: 1, borderColor: '#E7E5E4',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#78716C' },
  saveBtn: {
    flex: 1, height: 44, borderRadius: 100,
    backgroundColor: '#1C1917',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#E7E5E4' },
  saveBtnText: { fontSize: 14, color: '#FAF8F4', fontWeight: '500' },
  emptyText: {
    fontSize: 14, color: '#A8A29E',
    textAlign: 'center', marginTop: 24,
  },
})