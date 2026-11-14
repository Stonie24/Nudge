import React, { useEffect, useMemo, useState } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { AppText as Text } from '../components/AppText'
import { Icon } from '../components/Icon'
import { TagBadge } from '../components/TagPicker'
import { DueBadge } from '../components/DueBadge'
import { ChecklistSection } from '../components/ChecklistSection'
import {
  useTodayTasks,
  usePendingTodayTasks,
  useTodayCompletions,
  useCompleteRecurring,
} from '../hooks/useToday'
import { useCompleteTask, useUpdateTask } from '../hooks/useTasks'
import { triggerHaptic } from '../hooks/useAnimation'
import { useTheme } from '../lib/ThemeContext'
import { useUndoDelete } from '../lib/UndoDeleteContext'
import { showAlert } from '../lib/alert'
import {
  focusQueue,
  skip,
  formatRemaining,
  remainingMs,
  TIMER_PRESETS,
  type TimerState,
} from '../lib/focus'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'
import { displayFont } from '../lib/fonts'
import type { Task, ChecklistItem } from '../types'

/** Focus mode: today's unfinished tasks, one at a time, with an optional timer. */
export default function FocusScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { task: startParam } = useLocalSearchParams<{ task?: string }>()

  // Today's board, the same way the Today screen builds it (instant adds/ticks/edits included).
  const { data: serverTasks, isLoading } = useTodayTasks()
  const pendingAdds = usePendingTodayTasks()
  const { data: completions } = useTodayCompletions()
  const { hiddenTaskIds } = useUndoDelete()
  const doneHabitIds = useMemo(() => new Set(completions?.map(c => c.task_id) ?? []), [completions])
  const unfinished = useMemo(() => {
    const ids = new Set(serverTasks?.map(t => t.id))
    const all = [...(serverTasks ?? []), ...pendingAdds.filter(t => !ids.has(t.id))]
    return all.filter(t =>
      !hiddenTaskIds.has(t.id) && (t.recurring ? !doneHabitIds.has(t.id) : !t.completed)
    )
  }, [serverTasks, pendingAdds, hiddenTaskIds, doneHabitIds])

  const [skipped, setSkipped] = useState<string[]>([])
  const [startWith] = useState<string | null>(typeof startParam === 'string' ? startParam : null)
  const [doneCount, setDoneCount] = useState(0)
  const queue = useMemo(() => focusQueue(unfinished, { skipped, startWith }), [unfinished, skipped, startWith])
  const current = queue[0] ?? null

  const completeTask = useCompleteTask()
  const completeRecurring = useCompleteRecurring()
  const updateTask = useUpdateTask()

  function exit() {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  function markDone(task: Task) {
    triggerHaptic('medium')
    if (task.recurring) completeRecurring.mutate(task.id)
    else completeTask.mutate(task.id)
    setDoneCount(n => n + 1)
  }

  function saveChecklist(task: Task, next: ChecklistItem[]) {
    updateTask.mutate(
      { id: task.id, tag: task.tag, checklist: next }, // tag is always written; keep the saved one
      { onError: () => showAlert("Couldn't save checklist", "Your last checklist change wasn't saved. Please try again.") }
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={exit}
          style={styles.exitBtn}
          accessibilityRole="button"
          accessibilityLabel="Exit focus mode"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={16} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.focusLabel}>Focus</Text>
        <Text style={styles.leftCount} accessibilityLabel={`${queue.length} tasks left today`}>
          {current ? `${queue.length} left` : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : !current ? (
          <View style={styles.doneState}>
            <View style={styles.doneIcon}>
              <Icon name="check" size={28} color={colors.btnPrimaryText} strokeWidth={2.6} />
            </View>
            <Text style={styles.doneTitle}>
              {doneCount > 0 ? 'All done for today' : 'Nothing left on today\'s board'}
            </Text>
            <Text style={styles.muted}>
              {doneCount > 0
                ? `You finished ${doneCount} task${doneCount === 1 ? '' : 's'} in this focus session.`
                : 'Add something to Today, then come back to focus on it.'}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={exit} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Back to Today</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.taskCard} key={current.id}>
            <View style={styles.meta}>
              {current.tag && <TagBadge tag={current.tag} />}
              {current.recurring && (
                <View style={styles.daily}>
                  <Icon name="repeat" size={12} color={colors.accent} strokeWidth={2} />
                  <Text style={styles.dailyText}>daily</Text>
                </View>
              )}
              <DueBadge task={current} done={false} />
            </View>
            <Text style={styles.taskTitle}>{current.title}</Text>
            {!!current.notes && <Text style={styles.notes}>{current.notes}</Text>}
            {!current.recurring && (
              <ChecklistSection items={current.checklist ?? []} onChange={next => saveChecklist(current, next)} />
            )}
          </View>
        )}
        {current && (
          <View style={styles.timerArea}>
            <FocusTimer colors={colors} styles={styles} />
          </View>
        )}
      </ScrollView>

      {current && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, queue.length < 2 && styles.btnDisabled]}
            onPress={() => setSkipped(s => skip(s, current.id))}
            disabled={queue.length < 2}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.secondaryBtnText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.doneBtn]}
            onPress={() => markDone(current)}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${current.title} done`}
          >
            <Icon name="check" size={16} color={colors.btnPrimaryText} strokeWidth={2.4} />
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

/** Optional session timer. Counts down from a wall-clock end time, so it survives backgrounding. */
function FocusTimer({ colors, styles }: { colors: Colors; styles: Styles }) {
  const [timer, setTimer] = useState<TimerState>({ status: 'off' })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (timer.status !== 'running') return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= timer.endsAt) {
        setTimer({ status: 'finished', minutes: timer.minutes })
        triggerHaptic('medium')
      }
    }, 250)
    return () => clearInterval(id)
  }, [timer])

  const left = remainingMs(timer, now)

  if (timer.status === 'off') {
    return (
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Timer</Text>
        {TIMER_PRESETS.map(m => (
          <TouchableOpacity
            key={m}
            style={styles.chip}
            onPress={() => { setNow(Date.now()); setTimer({ status: 'running', endsAt: Date.now() + m * 60000, minutes: m }) }}
            accessibilityRole="button"
            accessibilityLabel={`Start a ${m} minute timer`}
          >
            <Text style={styles.chipText}>{m} min</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.timerBox}>
      <Text
        style={[styles.countdown, timer.status === 'finished' && styles.countdownDone]}
        accessibilityRole="timer"
        accessibilityLabel={timer.status === 'finished' ? 'Time is up' : `${formatRemaining(left)} left`}
      >
        {timer.status === 'finished' ? "Time's up" : formatRemaining(left)}
      </Text>
      <View style={styles.timerControls}>
        {timer.status === 'running' && (
          <TimerButton label="Pause" onPress={() => setTimer({ status: 'paused', remainingMs: left, minutes: timer.minutes })} styles={styles} />
        )}
        {timer.status === 'paused' && (
          <TimerButton label="Resume" onPress={() => { setNow(Date.now()); setTimer({ status: 'running', endsAt: Date.now() + timer.remainingMs, minutes: timer.minutes }) }} styles={styles} />
        )}
        {timer.status === 'finished' && (
          <TimerButton label="+5 min" onPress={() => { setNow(Date.now()); setTimer({ status: 'running', endsAt: Date.now() + 5 * 60000, minutes: 5 }) }} styles={styles} />
        )}
        <TimerButton label="Stop" onPress={() => setTimer({ status: 'off' })} styles={styles} muted />
      </View>
    </View>
  )
}

function TimerButton({ label, onPress, styles, muted }: { label: string; onPress: () => void; styles: Styles; muted?: boolean }) {
  return (
    <TouchableOpacity style={[styles.chip, muted && styles.chipMuted]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} timer`}>
      <Text style={[styles.chipText, muted && styles.chipTextMuted]}>{label}</Text>
    </TouchableOpacity>
  )
}

type Styles = ReturnType<typeof createStyles>

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: space.xxl, paddingTop: space.lg, paddingBottom: space.sm,
    },
    exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 64 },
    exitText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
    focusLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
    leftCount: { minWidth: 64, textAlign: 'right', fontSize: 13, color: c.textMuted, fontVariant: ['tabular-nums'] },
    // The task is the calm centre of the screen; the timer sits under it.
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.xxl, paddingVertical: space.xxl, gap: space.xxl, maxWidth: 640, width: '100%', alignSelf: 'center' },
    timerArea: { paddingTop: space.lg, borderTopWidth: 1, borderTopColor: c.borderLight },
    muted: { fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 20 },
    // Timer
    timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
    timerLabel: { fontSize: 13, color: c.textMuted, marginRight: space.xs },
    timerBox: { alignItems: 'center', gap: space.sm },
    countdown: { fontSize: 44, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'], letterSpacing: -1 },
    countdownDone: { fontSize: 32, color: c.accentText },
    timerControls: { flexDirection: 'row', gap: space.sm },
    chip: {
      paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.pill,
      borderWidth: 1, borderColor: c.accentBorder, backgroundColor: c.accentBg,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: c.accentText },
    chipMuted: { backgroundColor: c.surface, borderColor: c.border },
    chipTextMuted: { color: c.textSecondary },
    // Task
    taskCard: { gap: space.lg },
    meta: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
    daily: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dailyText: { fontSize: 12, color: c.accent, fontWeight: '500' },
    taskTitle: { fontSize: 30, lineHeight: 38, fontWeight: '700', color: c.text, fontFamily: displayFont.bold, letterSpacing: -0.5 },
    notes: { fontSize: 15, lineHeight: 22, color: c.textSecondary },
    // Actions
    actions: {
      flexDirection: 'row', gap: space.md, paddingHorizontal: space.xxl, paddingVertical: space.lg,
      borderTopWidth: 1, borderTopColor: c.borderLight, maxWidth: 640, width: '100%', alignSelf: 'center',
    },
    primaryBtn: {
      flexDirection: 'row', gap: space.xs, height: 52, paddingHorizontal: space.xxl,
      backgroundColor: c.btnPrimary, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    },
    doneBtn: { flex: 1 },
    primaryBtnText: { color: c.btnPrimaryText, fontSize: 15, fontWeight: '600' },
    secondaryBtn: {
      height: 52, paddingHorizontal: space.xl, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    },
    secondaryBtnText: { color: c.textSecondary, fontSize: 15, fontWeight: '500' },
    btnDisabled: { opacity: 0.4 },
    // All done
    doneState: { alignItems: 'center', gap: space.md },
    doneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    doneTitle: { fontSize: 22, fontWeight: '700', color: c.text, fontFamily: displayFont.bold },
  })
}
