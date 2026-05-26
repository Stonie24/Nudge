import React, { useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import type { CalendarEvent, Task } from '../types'

type ViewMode = 'week' | 'month'

function getWeekDays(date: Date): Date[] {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday start
  start.setDate(start.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getMonthDays(date: Date): (Date | null)[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days: (Date | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function eventMatchesDate(eventTime: string, dateStr: string): boolean {
  const eventDate = new Date(eventTime)
  return toDateStr(eventDate) === dateStr
}

function DayCell({
  date,
  isToday,
  isSelected,
  events,
  tasks,
  onPress,
  isWeek,
  colors,
}: {
  date: Date | null
  isToday?: boolean
  isSelected?: boolean
  events: CalendarEvent[]
  tasks: Task[]
  onPress?: () => void
  isWeek?: boolean
  colors: Colors
}) {
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!date) return <View style={styles.emptyCell} />

  const nudgeEvents = events.filter(e => e.source === 'nudge')
  const googleEvents = events.filter(e => e.source === 'google')
  const appleEvents = events.filter(e => e.source === 'apple')

  // Split tasks: recurring (daily habits) vs one-time scheduled
  const scheduledTasks = tasks.filter(t => !t.recurring)
  const recurringTasks = tasks.filter(t => t.recurring)

  const dots: string[] = []
  if (nudgeEvents.length > 0) dots.push('#F59F0A')
  if (googleEvents.length > 0) dots.push('#4285F4')
  if (appleEvents.length > 0) dots.push('#FF9500')
  if (scheduledTasks.length > 0) dots.push(colors.calendarDotTask)
  if (recurringTasks.length > 0) dots.push(colors.calendarDotRecurring)

  const visibleDots = dots.slice(0, 4)

  return (
    <TouchableOpacity
      style={[isWeek ? styles.weekCell : styles.dayCell, isSelected && styles.dayCellSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.dayNumber, isToday && styles.dayNumberToday, isSelected && styles.dayNumberSelected]}>
        <Text style={[
          styles.dayNumberText,
          isToday && styles.dayNumberTextToday,
          isSelected && styles.dayNumberTextSelected,
        ]}>
          {date.getDate()}
        </Text>
      </View>
      <View style={styles.dots}>
        {visibleDots.map((color, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: color }]} />
        ))}
      </View>
    </TouchableOpacity>
  )
}

export function CalendarView({
  mode,
  currentDate,
  selectedDate,
  events,
  tasks,
  onSelectDate,
  onPrevious,
  onNext,
}: {
  mode: ViewMode
  currentDate: Date
  selectedDate: string
  events: CalendarEvent[]
  tasks: Task[]
  onSelectDate: (date: string) => void
  onPrevious: () => void
  onNext: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const today = toDateStr(new Date())

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function getEventsForDate(date: Date) {
    const str = toDateStr(date)
    return events.filter(e => eventMatchesDate(e.start_time, str))
  }

  function getTasksForDate(date: Date) {
    const str = toDateStr(date)
    return tasks.filter(t => t.scheduled_date === str || t.recurring)
  }

  const weekDays = getWeekDays(currentDate)
  const monthDays = getMonthDays(currentDate)

  const headerTitle = mode === 'week'
    ? `${weekDays[0].toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-SE', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : currentDate.toLocaleDateString('en-SE', { month: 'long', year: 'numeric' })

  return (
    <View style={styles.container}>
      {/* Navigation header */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={onPrevious} activeOpacity={0.7}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{headerTitle}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={onNext} activeOpacity={0.7}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {DAYS.map(d => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      {mode === 'week' ? (
        <View style={styles.weekRow}>
          {weekDays.map(date => (
            <DayCell
              key={toDateStr(date)}
              date={date}
              isToday={toDateStr(date) === today}
              isSelected={toDateStr(date) === selectedDate}
              events={getEventsForDate(date)}
              tasks={getTasksForDate(date)}
              onPress={() => onSelectDate(toDateStr(date))}
              isWeek
              colors={colors}
            />
          ))}
        </View>
      ) : (
        <View style={styles.monthGrid}>
          {monthDays.map((date, i) => (
            <DayCell
              key={i}
              date={date}
              isToday={date ? toDateStr(date) === today : false}
              isSelected={date ? toDateStr(date) === selectedDate : false}
              events={date ? getEventsForDate(date) : []}
              tasks={date ? getTasksForDate(date) : []}
              onPress={date ? () => onSelectDate(toDateStr(date)) : undefined}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBtnText: {
      fontSize: 20,
      color: c.text,
      lineHeight: 24,
    },
    navTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    dayLabels: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    dayLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.5,
    },
    weekRow: {
      flexDirection: 'row',
    },
    weekCell: {
      flex: 1,
      aspectRatio: 0.85,
      alignItems: 'center',
      paddingTop: 4,
      borderRadius: 10,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    emptyCell: {
      width: '14.28%',
      aspectRatio: 0.85,
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 0.85,
      alignItems: 'center',
      paddingTop: 4,
      borderRadius: 10,
    },
    dayCellSelected: {
      backgroundColor: c.surfaceMuted,
    },
    dayNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumberToday: {
      backgroundColor: c.btnPrimary,
    },
    dayNumberSelected: {
      backgroundColor: c.accentBg,
    },
    dayNumberText: {
      fontSize: 13,
      color: c.text,
      fontWeight: '400',
    },
    dayNumberTextToday: {
      color: c.btnPrimaryText,
      fontWeight: '600',
    },
    dayNumberTextSelected: {
      color: c.accentText,
      fontWeight: '600',
    },
    dots: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 3,
      height: 6,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
  })
}
