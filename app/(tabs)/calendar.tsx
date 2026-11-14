import React, { useState, useMemo } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { AppText as Text } from '../../components/AppText'
import { Icon } from '../../components/Icon'
import { useNudgeEvents, useGoogleEvents, useAppleEvents } from '../../hooks/useCalendar'
import { useGoogleCalendarAuth } from '../../hooks/useGoogleCalendarAuth'
import { useTodayTasks, useTodayCompletions } from '../../hooks/useToday'
import { useTasks } from '../../hooks/useTasks'
import { useTheme } from '../../lib/ThemeContext'
import { CalendarView } from '../../components/CalendarView'
import { DaySheet } from '../../components/DaySheet'
import type { Colors } from '../../lib/theme'
import { space, radius } from '../../lib/theme'
import { displayFont } from '../../lib/fonts'
import type { CalendarEvent, Task } from '../../types'

type ViewMode = 'week' | 'month'

function toDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function eventMatchesDate(eventTime: string, dateStr: string): boolean {
  return toDateStr(new Date(eventTime)) === dateStr
}

function getRangeForDate(date: Date, mode: ViewMode): { start: string; end: string } {
  if (mode === 'week') {
    const start = new Date(date)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: toDateStr(start), end: toDateStr(end) }
  } else {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { start: toDateStr(start), end: toDateStr(end) }
  }
}

export default function CalendarScreen() {
  const [mode, setMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [daySheetOpen, setDaySheetOpen] = useState(false)

  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const { start, end } = getRangeForDate(currentDate, mode)
  const { isConnected, accessToken } = useGoogleCalendarAuth()

  const { data: nudgeEvents = [] } = useNudgeEvents(start, end)
  const { data: googleEvents = [] } = useGoogleEvents(start, end, accessToken)
  const { data: appleEvents = [] } = useAppleEvents(start, end)
  const { data: allTasks = [] } = useTasks()
  const { data: completions = [] } = useTodayCompletions()

  const completedTodayIds = new Set(completions.map(c => c.task_id))

  const allEvents: CalendarEvent[] = [...nudgeEvents, ...googleEvents, ...appleEvents]

  function getEventsForDate(date: string) {
    return allEvents.filter(e => eventMatchesDate(e.start_time, date))
  }

  function getTasksForDate(date: string) {
    return allTasks.filter(t =>
      t.recurring || t.scheduled_date === date
    )
  }

  function handlePrevious() {
    const d = new Date(currentDate)
    if (mode === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  function handleNext() {
    const d = new Date(currentDate)
    if (mode === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setDaySheetOpen(true)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>

          {/* View mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'week' && styles.modeBtnActive]}
              onPress={() => setMode('week')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeBtnText, mode === 'week' && styles.modeBtnTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'month' && styles.modeBtnActive]}
              onPress={() => setMode('month')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeBtnText, mode === 'month' && styles.modeBtnTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar grid */}
        <CalendarView
          mode={mode}
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={allEvents}
          tasks={allTasks}
          onSelectDate={handleSelectDate}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.calendarDotTask }]} />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.calendarDotRecurring }]} />
            <Text style={styles.legendText}>Daily</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.calendarDotEvent }]} />
            <Text style={styles.legendText}>Events</Text>
          </View>
          {isConnected && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
              <Text style={styles.legendText}>Google</Text>
            </View>
          )}
          {Platform.OS === 'ios' && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Apple</Text>
            </View>
          )}
        </View>

        {/* Integrations now live in Settings — nudge there if Google isn't connected */}
        {!isConnected && (
          <TouchableOpacity
            style={styles.connectHint}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.connectHintText}>
              Connect Google Calendar in Settings to see your events here
            </Text>
            <Icon name="chevron" size={16} color={colors.textFaint} strokeWidth={1.8} />
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Day detail sheet */}
      <DaySheet
        visible={daySheetOpen}
        date={selectedDate}
        events={getEventsForDate(selectedDate)}
        tasks={getTasksForDate(selectedDate)}
        completedTodayIds={completedTodayIds}
        onClose={() => setDaySheetOpen(false)}
      />
    </SafeAreaView>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: space.xxl, paddingBottom: 60 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space.xxxl,
      marginBottom: space.xl,
    },
    title: {
      fontSize: 28, fontWeight: '700', color: c.text,
      letterSpacing: -0.5,
      fontFamily: displayFont.bold,
    },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: c.surfaceAlt,
      borderRadius: radius.md,
      padding: space.xs,
    },
    modeBtn: {
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
      borderRadius: radius.sm,
    },
    modeBtnActive: { backgroundColor: c.surface },
    modeBtnText: { fontSize: 13, color: c.textMuted, fontWeight: '500' },
    modeBtnTextActive: { color: c.text },
    legend: {
      flexDirection: 'row',
      gap: space.lg,
      marginTop: space.lg,
      marginBottom: space.xxl,
      flexWrap: 'wrap',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: c.textMuted },
    connectHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderLight,
      backgroundColor: c.surfaceMuted,
    },
    connectHintText: { flex: 1, fontSize: 13, color: c.textMuted },
  })
}
