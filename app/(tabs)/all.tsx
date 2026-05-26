import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native'
import { useTasks, useCompleteTask, useUncompleteTask, useDeleteTask, useUpdateTask } from '../../hooks/useTasks'
import { useLayout } from '../../hooks/useLayout'
import { useTheme } from '../../lib/ThemeContext'
import { TagBadge } from '../../components/TagPicker'
import { KanbanBoard } from '../../components/KanbanBoard'
import { AddBacklogTaskSheet } from '../../components/AddBacklogTaskSheet'
import { showAlert } from '../../lib/alert'
import { getTagColor } from '../../lib/tagColor'
import { useEntranceAnimation, useCheckboxAnimation, usePressAnimation, triggerHaptic } from '../../hooks/useAnimation'
import type { Colors } from '../../lib/theme'
import type { Task } from '../../types'

type Filter = 'all' | 'pending' | 'completed'
type Sort = 'newest' | 'oldest'

function TaskItem({ task, onComplete, onUncomplete, onDelete, colors, index = 0 }: {
  task: Task
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  colors: Colors
  index?: number
}) {
  const styles = useMemo(() => createStyles(colors), [colors])
  const { opacity, translateY } = useEntranceAnimation(Math.min(index * 35, 180))
  const { scale: checkboxScale, ringScale, ringOpacity, triggerComplete, triggerUncomplete } = useCheckboxAnimation()

  function handleLongPress() {
    showAlert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
    ])
  }

  function handlePress() {
    if (task.completed) {
      triggerUncomplete()
      triggerHaptic('light')
      onUncomplete(task.id)
    } else {
      triggerComplete()
      triggerHaptic('medium')
      onComplete(task.id)
    }
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={styles.taskRow}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxWrap}>
          <Animated.View
            style={[styles.checkboxRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
          />
          <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
            <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
              {task.completed && <View style={styles.checkmark} />}
            </View>
          </Animated.View>
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
    </Animated.View>
  )
}

export default function AllTasksScreen() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { isDesktop } = useLayout()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const addBtn = usePressAnimation()

  const { data: tasks, isLoading } = useTasks()
  const completeTask = useCompleteTask()
  const uncompleteTask = useUncompleteTask()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()

  const filtered = useMemo(() => {
    if (!tasks) return []
    let result = [...tasks]
    if (search.trim()) result = result.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.tag && t.tag.toLowerCase().includes(search.toLowerCase()))
    )
    if (filter === 'pending') result = result.filter(t => !t.completed)
    if (filter === 'completed') result = result.filter(t => t.completed)
    if (selectedTag) result = result.filter(t => t.tag === selectedTag)
    result.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return sort === 'newest' ? diff : -diff
    })
    return result
  }, [tasks, search, filter, sort, selectedTag])

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    for (const task of filtered) {
      const key = task.tag ?? 'No tag'
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    }
    return Object.entries(groups)
  }, [filtered])

  const availableTags = useMemo(() => {
    if (!tasks) return []
    const seen = new Set<string>()
    const tags: string[] = []
    for (const t of tasks) {
      if (t.tag && !seen.has(t.tag)) {
        seen.add(t.tag)
        tags.push(t.tag)
      }
    }
    return tags.sort()
  }, [tasks])

  const total = tasks?.length ?? 0
  const pendingCount = tasks?.filter(t => !t.completed).length ?? 0

  const controls = (
    <View style={[styles.controls, isDesktop && styles.controlsDesktop]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>All tasks</Text>
            <Text style={styles.subtitle}>{pendingCount} pending · {total} total</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: addBtn.scale }] }}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setSheetOpen(true)}
              onPressIn={addBtn.onPressIn}
              onPressOut={addBtn.onPressOut}
              activeOpacity={1}
            >
              <Text style={styles.addBtnText}>+ New task</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks or tags..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {availableTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagFilterScroll}
          contentContainerStyle={styles.tagFilterContent}
        >
          <TouchableOpacity
            style={[styles.tagAllChip, !selectedTag && styles.tagAllChipActive]}
            onPress={() => setSelectedTag(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tagAllChipText, !selectedTag && styles.tagAllChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {availableTags.map(tag => {
            const c = getTagColor(tag)
            const isActive = selectedTag === tag
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  { backgroundColor: isActive ? c.bg : colors.surface, borderColor: isActive ? c.border : colors.border },
                ]}
                onPress={() => setSelectedTag(isActive ? null : tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagChipText, { color: isActive ? c.text : colors.textSecondary }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

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
                  {search || selectedTag ? 'No tasks match your filters.' : 'No tasks yet — add one above!'}
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
                  {search || selectedTag ? 'No tasks match your filters.' : 'No tasks yet — add one above!'}
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
              {tagTasks.map((task, i) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={id => completeTask.mutate(id)}
                  onUncomplete={id => uncompleteTask.mutate(id)}
                  onDelete={id => deleteTask.mutate(id)}
                  colors={colors}
                  index={i}
                />
              ))}
            </View>
          )}
        />
      )}

      <AddBacklogTaskSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    desktopWrap: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    controls: { paddingHorizontal: 24 },
    controlsDesktop: { paddingVertical: 8 },
    header: { marginTop: 32, marginBottom: 20 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 28, fontWeight: '700', color: c.text,
      letterSpacing: -0.5,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    subtitle: { fontSize: 14, color: c.textMuted, marginTop: 4, fontWeight: '300' },
    addBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: c.btnPrimary,
      borderRadius: 100,
    },
    addBtnText: {
      color: c.btnPrimaryText,
      fontSize: 14,
      fontWeight: '500',
    },
    searchRow: { marginBottom: 12 },
    searchInput: {
      height: 44, backgroundColor: c.inputBg,
      borderWidth: 1, borderColor: c.border, borderRadius: 12,
      paddingHorizontal: 16, fontSize: 15, color: c.text,
    },
    tagFilterScroll: { marginBottom: 12 },
    tagFilterContent: { gap: 8, paddingRight: 4 },
    tagAllChip: {
      paddingVertical: 6, paddingHorizontal: 14,
      borderRadius: 100, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    tagAllChipActive: { backgroundColor: c.btnPrimary, borderColor: c.btnPrimary },
    tagAllChipText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    tagAllChipTextActive: { color: c.btnPrimaryText },
    tagChip: {
      paddingVertical: 6, paddingHorizontal: 14,
      borderRadius: 100, borderWidth: 1,
    },
    tagChipText: { fontSize: 13, fontWeight: '500' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    filterTab: {
      paddingVertical: 6, paddingHorizontal: 14,
      borderRadius: 100, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    filterTabActive: { backgroundColor: c.btnPrimary, borderColor: c.btnPrimary },
    filterTabText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    filterTabTextActive: { color: c.btnPrimaryText },
    sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    sortLabel: { fontSize: 13, color: c.textMuted },
    sortBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: c.border },
    sortBtnActive: { backgroundColor: c.accentBg, borderColor: c.accentBorder },
    sortBtnText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
    sortBtnTextActive: { color: c.accentText },
    group: { marginBottom: 24 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    groupDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
    groupLabel: {
      fontSize: 11, fontWeight: '600', color: c.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase', flex: 1,
    },
    groupCount: { fontSize: 11, color: c.textMuted },
    taskRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 13, borderBottomWidth: 1,
      borderBottomColor: c.borderLight, gap: 14,
    },
    checkboxWrap: {
      width: 22, height: 22,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxRing: {
      position: 'absolute',
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: c.accent,
    },
    checkbox: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 1.5, borderColor: c.textFaint,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxDone: { backgroundColor: c.accent, borderColor: c.accent },
    checkmark: {
      width: 6, height: 10, borderRightWidth: 2,
      borderBottomWidth: 2, borderColor: '#FFFFFF',
      transform: [{ rotate: '40deg' }, { translateY: -1 }],
    },
    taskContent: { flex: 1, gap: 4 },
    taskTitle: { fontSize: 15, color: c.text, lineHeight: 22 },
    taskTitleDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    taskDate: { fontSize: 12, color: c.textMuted },
    emptyText: { fontSize: 14, color: c.textMuted, textAlign: 'center', marginTop: 40 },
  })
}
