import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native'
import { useTasks, useCompleteTask, useUncompleteTask, useDeleteTask, useUpdateTask } from '../../hooks/useTasks'
import { useLayout } from '../../hooks/useLayout'
import { TagBadge } from '../../components/TagPicker'
import { KanbanBoard } from '../../components/KanbanBoard'
import type { Task } from '../../types'

type Filter = 'all' | 'pending' | 'completed'
type Sort = 'newest' | 'oldest'

function TaskItem({ task, onComplete, onUncomplete, onDelete }: {
  task: Task
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  function handleLongPress() {
    Alert.alert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
    ])
  }
  return (
    <TouchableOpacity
      style={styles.taskRow}
      onPress={() => task.completed ? onUncomplete(task.id) : onComplete(task.id)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
        {task.completed && <View style={styles.checkmark} />}
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
          {task.title}
        </Text>
        {task.tag && <TagBadge tag={task.tag} />}
      </View>
      <Text style={styles.taskDate}>
        {new Date(task.created_at).toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })}
      </Text>
    </TouchableOpacity>
  )
}

export default function AllTasksScreen() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const { isDesktop } = useLayout()

  const { data: tasks, isLoading } = useTasks()
  const completeTask = useCompleteTask()
  const uncompleteTask = useUncompleteTask()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()

  const filtered = useMemo(() => {
    if (!tasks) return []
    let result = [...tasks]
    if (search.trim()) result = result.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'pending') result = result.filter(t => !t.completed)
    if (filter === 'completed') result = result.filter(t => t.completed)
    result.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return sort === 'newest' ? diff : -diff
    })
    return result
  }, [tasks, search, filter, sort])

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    for (const task of filtered) {
      const key = task.tag ?? 'No tag'
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    }
    return Object.entries(groups)
  }, [filtered])

  const total = tasks?.length ?? 0
  const pendingCount = tasks?.filter(t => !t.completed).length ?? 0

  const controls = (
    <View style={[styles.controls, isDesktop && styles.controlsDesktop]}>
      <View style={styles.header}>
        <Text style={styles.title}>All tasks</Text>
        <Text style={styles.subtitle}>{pendingCount} pending · {total} total</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#A8A29E"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {(['newest', 'oldest'] as Sort[]).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortBtn, sort === s && styles.sortBtnActive]}
            onPress={() => setSort(s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortBtnText, sort === s && styles.sortBtnTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe}>
      {isDesktop ? (
        <View style={styles.desktopWrap}>
          {controls}
          {isLoading
            ? <Text style={styles.emptyText}>Loading...</Text>
            : filtered.length > 0
              ? <KanbanBoard
                  tasks={filtered}
                  onComplete={id => completeTask.mutate(id)}
                  onUncomplete={id => uncompleteTask.mutate(id)}
                  onDelete={id => deleteTask.mutate(id)}
                  onUpdateTag={(id, tag) => updateTask.mutate({ id, tag })}
                />
              : <Text style={styles.emptyText}>
                  {search ? 'No tasks match your search.' : 'No tasks yet.'}
                </Text>
          }
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([tag]) => tag}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View>
              {controls}
              {isLoading && <Text style={styles.emptyText}>Loading...</Text>}
              {!isLoading && filtered.length === 0 && (
                <Text style={styles.emptyText}>
                  {search ? 'No tasks match your search.' : 'No tasks yet.'}
                </Text>
              )}
            </View>
          }
          renderItem={({ item: [tag, tagTasks] }) => (
            <View style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={styles.groupDot} />
                <Text style={styles.groupLabel}>{tag}</Text>
                <Text style={styles.groupCount}>{tagTasks.length}</Text>
              </View>
              {tagTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={id => completeTask.mutate(id)}
                  onUncomplete={id => uncompleteTask.mutate(id)}
                  onDelete={id => deleteTask.mutate(id)}
                />
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F4' },
  desktopWrap: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  controls: { paddingHorizontal: 24 },
  controlsDesktop: { paddingVertical: 8 },
  header: { marginTop: 32, marginBottom: 20 },
  title: {
    fontSize: 28, fontWeight: '700', color: '#1C1917',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: { fontSize: 14, color: '#A8A29E', marginTop: 4, fontWeight: '300' },
  searchRow: { marginBottom: 16 },
  searchInput: {
    height: 44, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 12,
    paddingHorizontal: 16, fontSize: 15, color: '#1C1917',
  },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterTab: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 100, borderWidth: 1, borderColor: '#E7E5E4', backgroundColor: '#FFFFFF',
  },
  filterTabActive: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  filterTabText: { fontSize: 13, color: '#78716C', fontWeight: '500' },
  filterTabTextActive: { color: '#FAF8F4' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  sortLabel: { fontSize: 13, color: '#A8A29E' },
  sortBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: '#E7E5E4' },
  sortBtnActive: { backgroundColor: '#EAF3DE', borderColor: '#639922' },
  sortBtnText: { fontSize: 12, color: '#78716C', fontWeight: '500' },
  sortBtnTextActive: { color: '#3B6D11' },
  group: { marginBottom: 24 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  groupDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#639922' },
  groupLabel: {
    fontSize: 11, fontWeight: '600', color: '#A8A29E',
    letterSpacing: 0.8, textTransform: 'uppercase', flex: 1,
  },
  groupCount: { fontSize: 11, color: '#A8A29E' },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1,
    borderBottomColor: '#F5F3EF', gap: 14,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#D6D3D1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#639922', borderColor: '#639922' },
  checkmark: {
    width: 6, height: 10, borderRightWidth: 2,
    borderBottomWidth: 2, borderColor: '#FFFFFF',
    transform: [{ rotate: '40deg' }, { translateY: -1 }],
  },
  taskContent: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, color: '#1C1917', lineHeight: 22 },
  taskTitleDone: { color: '#A8A29E', textDecorationLine: 'line-through' },
  taskDate: { fontSize: 12, color: '#A8A29E' },
  emptyText: { fontSize: 14, color: '#A8A29E', textAlign: 'center', marginTop: 40 },
})