import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native'
import {
  useTodayTasks,
  useTodayCompletions,
  useCompleteRecurring,
  useUncompleteRecurring,
  useScheduleForToday,
} from '../../hooks/useToday'
import { useCompleteTask, useUncompleteTask, useDeleteTask, useUpdateTask } from '../../hooks/useTasks'
import { useLayout } from '../../hooks/useLayout'
import { useTheme } from '../../lib/ThemeContext'
import { TagPicker } from '../../components/TagPicker'
import { KanbanBoard } from '../../components/KanbanBoard'
import { AddTaskSheet } from '../../components/Addtasksheet'
import { showAlert } from '../../lib/alert'
import { useEntranceAnimation, useCheckboxAnimation, usePressAnimation, triggerHaptic } from '../../hooks/useAnimation'
import type { Colors } from '../../lib/theme'
import type { Task } from '../../types'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-SE', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function getNudgeMessage(total: number, completed: number) {
  if (total === 0) return "Nothing on the board yet. Add something to get started."
  if (completed === 0) return `${total} thing${total > 1 ? 's' : ''} for today. No rush.`
  if (completed === total) return "Everything done! Enjoy the rest of your day 🌿"
  return `${completed} done, ${total - completed} to go. You've got this.`
}

function TaskItem({
  task,
  completedToday,
  onComplete,
  onUncomplete,
  onDelete,
  onUpdateTag,
  colors,
  index = 0,
}: {
  task: Task
  completedToday: boolean
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTag: (id: string, tag?: string) => void
  colors: Colors
  index?: number
}) {
  function handleLongPress() {
    showAlert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
    ])
  }

  const isDone = task.recurring ? completedToday : task.completed
  const styles = useMemo(() => createStyles(colors), [colors])
  const { opacity, translateY } = useEntranceAnimation(Math.min(index * 40, 200))
  const { scale: checkboxScale, ringScale, ringOpacity, triggerComplete, triggerUncomplete } = useCheckboxAnimation()

  function handlePress() {
    if (isDone) {
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
          {/* Ripple ring — only visible during completion burst */}
          <Animated.View
            style={[styles.checkboxRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
          />
          <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
            <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
              {isDone && <View style={styles.checkmark} />}
            </View>
          </Animated.View>
        </View>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
            {task.title}
          </Text>
          {task.recurring && (
            <Text style={styles.recurringBadge}>↻ daily</Text>
          )}
        </View>
        <TagPicker value={task.tag} onChange={tag => onUpdateTag(task.id, tag)} />
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function TodayScreen() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { isDesktop } = useLayout()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const addBtn = usePressAnimation()

  const { data: tasks, isLoading } = useTodayTasks()
  const { data: completions } = useTodayCompletions()

  const completeRecurring = useCompleteRecurring()
  const uncompleteRecurring = useUncompleteRecurring()
  const completeTask = useCompleteTask()
  const uncompleteTask = useUncompleteTask()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()

  const completedTodayIds = new Set(completions?.map(c => c.task_id) ?? [])
  const todayTaskIds = tasks?.map(t => t.id) ?? []

  const total = tasks?.length ?? 0
  const completed = tasks?.filter(t =>
    t.recurring ? completedTodayIds.has(t.id) : t.completed
  ).length ?? 0

  const pending = tasks?.filter(t =>
    t.recurring ? !completedTodayIds.has(t.id) : !t.completed
  ) ?? []

  const done = tasks?.filter(t =>
    t.recurring ? completedTodayIds.has(t.id) : t.completed
  ) ?? []

  function handleComplete(task: Task) {
    if (task.recurring) {
      completeRecurring.mutate(task.id)
    } else {
      completeTask.mutate(task.id)
    }
  }

  function handleUncomplete(task: Task) {
    if (task.recurring) {
      uncompleteRecurring.mutate(task.id)
    } else {
      uncompleteTask.mutate(task.id)
    }
  }

  const augmentedTasks = tasks?.map(t => ({
    ...t,
    completed: t.recurring ? completedTodayIds.has(t.id) : t.completed,
  })) ?? []

  const header = (
    <View style={[styles.headerWrap, isDesktop && styles.headerWrapDesktop]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.date}>{formatDate()}</Text>
      </View>
      <View style={styles.nudgeBanner}>
        <Text style={styles.nudgeText}>{getNudgeMessage(total, completed)}</Text>
      </View>
      <Animated.View style={{ transform: [{ scale: addBtn.scale }] }}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setSheetOpen(true)}
          onPressIn={addBtn.onPressIn}
          onPressOut={addBtn.onPressOut}
          activeOpacity={1}
        >
          <Text style={styles.addBtnText}>+ Add task</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe}>
      {isDesktop ? (
        <View style={styles.desktopWrap}>
          {header}
          {isLoading
            ? <Text style={styles.emptyText}>Loading...</Text>
            : augmentedTasks.length > 0
              ? <KanbanBoard
                  tasks={augmentedTasks}
                  onComplete={id => handleComplete(tasks?.find(t => t.id === id)!)}
                  onUncomplete={id => handleUncomplete(tasks?.find(t => t.id === id)!)}
                  onDelete={id => deleteTask.mutate(id)}
                  onUpdateTag={(id, tag) => updateTask.mutate({ id, tag })}
                />
              : <Text style={styles.emptyText}>Nothing on the board yet — add something above.</Text>
          }
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View>
              {header}
              {pending.length > 0 && <Text style={styles.sectionLabel}>To do</Text>}
              {isLoading && <Text style={styles.emptyText}>Loading...</Text>}
            </View>
          }
          renderItem={({ item, index }) => (
            <TaskItem
              task={item}
              completedToday={completedTodayIds.has(item.id)}
              onComplete={() => handleComplete(item)}
              onUncomplete={() => handleUncomplete(item)}
              onDelete={id => deleteTask.mutate(id)}
              onUpdateTag={(id, tag) => updateTask.mutate({ id, tag })}
              colors={colors}
              index={index}
            />
          )}
          ListFooterComponent={
            done.length > 0 ? (
              <View>
                <Text style={styles.sectionLabel}>Done</Text>
                {done.map((task, i) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    completedToday={completedTodayIds.has(task.id)}
                    onComplete={() => handleComplete(task)}
                    onUncomplete={() => handleUncomplete(task)}
                    onDelete={id => deleteTask.mutate(id)}
                    onUpdateTag={(id, tag) => updateTask.mutate({ id, tag })}
                    colors={colors}
                    index={i}
                  />
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>Nothing here yet — add something above.</Text>
            ) : null
          }
        />
      )}

      <AddTaskSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        todayTaskIds={todayTaskIds}
      />
    </SafeAreaView>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    desktopWrap: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    headerWrap: { paddingHorizontal: 24 },
    headerWrapDesktop: { paddingVertical: 8 },
    header: { marginTop: 32, marginBottom: 20 },
    greeting: {
      fontSize: 28, fontWeight: '700', color: c.text,
      letterSpacing: -0.5,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    date: { fontSize: 14, color: c.textMuted, marginTop: 4, fontWeight: '300' },
    nudgeBanner: {
      backgroundColor: c.accentBg, borderRadius: 12,
      padding: 14, marginBottom: 20,
    },
    nudgeText: { fontSize: 14, color: c.accentText, fontWeight: '400', lineHeight: 20 },
    addBtn: {
      height: 52, backgroundColor: c.btnPrimary,
      borderRadius: 100, alignItems: 'center',
      justifyContent: 'center', marginBottom: 28,
    },
    addBtnText: { color: c.btnPrimaryText, fontSize: 15, fontWeight: '500' },
    sectionLabel: {
      fontSize: 11, fontWeight: '600', color: c.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
    },
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
    taskContent: { flex: 1, gap: 3 },
    taskTitle: { fontSize: 15, color: c.text, lineHeight: 22 },
    taskTitleDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    recurringBadge: { fontSize: 11, color: c.accent, fontWeight: '500' },
    emptyText: { fontSize: 14, color: c.textMuted, textAlign: 'center', marginTop: 40 },
  })
}
