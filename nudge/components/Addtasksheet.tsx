import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    Pressable,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Switch,
} from 'react-native'
import { useAddTodayTask, useScheduleForToday } from '../hooks/useToday'
import { useTasks } from '../hooks/useTasks'
import { TagPicker } from './TagPicker'
import { TagBadge } from './TagPicker'
import type { Task } from '../types'

type Tab = 'new' | 'backlog'

export function AddTaskSheet({
    visible,
    onClose,
    todayTaskIds,
}: {
    visible: boolean
    onClose: () => void
    todayTaskIds: string[]
}) {
    const [tab, setTab] = useState<Tab>('new')
    const [title, setTitle] = useState('')
    const [tag, setTag] = useState<string | undefined>()
    const [recurring, setRecurring] = useState(false)

    const addTodayTask = useAddTodayTask()
    const scheduleForToday = useScheduleForToday()
    const { data: allTasks, isLoading } = useTasks()

  // Backlog = tasks not already on today's board and not recurring
    const backlog = allTasks?.filter(t =>
    !t.recurring && !todayTaskIds.includes(t.id) && !t.completed
) ?? []

function reset() {
    setTitle('')
    setTag(undefined)
    setRecurring(false)
    setTab('new')
}

function handleClose() {
    reset()
    onClose()
  }

  async function handleAdd() {
    const t = title.trim()
    if (!t) return
    await addTodayTask.mutateAsync({ title: t, tag, recurring })
    reset()
    onClose()
  }

  async function handleSchedule(task: Task) {
    await scheduleForToday.mutateAsync(task.id)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'new' && styles.tabActive]}
              onPress={() => setTab('new')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>
                New task
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'backlog' && styles.tabActive]}
              onPress={() => setTab('backlog')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === 'backlog' && styles.tabTextActive]}>
                From backlog
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'new' ? (
            <View style={styles.newTask}>
              <TextInput
                style={styles.input}
                placeholder="What do you need to do?"
                placeholderTextColor="#A8A29E"
                value={title}
                onChangeText={setTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />

              <TagPicker value={tag} onChange={setTag} />

              {/* Recurring toggle */}
              <View style={styles.recurringRow}>
                <View style={styles.recurringLabel}>
                  <Text style={styles.recurringTitle}>Repeat daily</Text>
                  <Text style={styles.recurringHint}>
                    This task will reset every day at midnight
                  </Text>
                </View>
                <Switch
                  value={recurring}
                  onValueChange={setRecurring}
                  trackColor={{ false: '#E7E5E4', true: '#639922' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!title.trim() || addTodayTask.isPending}
                activeOpacity={0.8}
              >
                {addTodayTask.isPending
                  ? <ActivityIndicator color="#FAF8F4" />
                  : <Text style={styles.addBtnText}>Add to today</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.backlog}>
              {isLoading ? (
                <ActivityIndicator color="#639922" style={styles.loader} />
              ) : backlog.length === 0 ? (
                <Text style={styles.emptyText}>
                  No backlog tasks — everything is already on today's board or completed!
                </Text>
              ) : (
                <FlatList
                  data={backlog}
                  keyExtractor={item => item.id}
                  style={styles.backlogList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.backlogRow}
                      onPress={() => handleSchedule(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.backlogText}>
                        <Text style={styles.backlogTitle}>{item.title}</Text>
                        {item.tag && <TagBadge tag={item.tag} />}
                      </View>
                      <Text style={styles.addIcon}>+</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1EFE8',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 8,
    borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, color: '#A8A29E', fontWeight: '500' },
  tabTextActive: { color: '#1C1917' },
  newTask: { gap: 16 },
  input: {
    height: 50, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E7E5E4',
    borderRadius: 12, paddingHorizontal: 16,
    fontSize: 15, color: '#1C1917',
  },
  recurringRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E7E5E4',
    padding: 14, gap: 12,
  },
  recurringLabel: { flex: 1 },
  recurringTitle: { fontSize: 15, color: '#1C1917', fontWeight: '500' },
  recurringHint: { fontSize: 12, color: '#A8A29E', marginTop: 2 },
  addBtn: {
    height: 52, backgroundColor: '#1C1917',
    borderRadius: 100, alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#E7E5E4' },
  addBtnText: { color: '#FAF8F4', fontSize: 15, fontWeight: '500' },
  backlog: { minHeight: 200 },
  backlogList: { maxHeight: 400 },
  backlogRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: '#F5F3EF', gap: 12,
  },
  backlogText: { flex: 1, gap: 4 },
  backlogTitle: { fontSize: 15, color: '#1C1917' },
  addIcon: { fontSize: 22, color: '#639922', fontWeight: '300' },
  loader: { marginTop: 40 },
  emptyText: {
    fontSize: 14, color: '#A8A29E',
    textAlign: 'center', marginTop: 40, lineHeight: 22,
  },
})