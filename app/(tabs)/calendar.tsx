import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native'
import { useNudgeEvents, useGoogleEvents, useAppleEvents } from '../../hooks/useCalendar'
import { useGoogleCalendarAuth } from '../../hooks/useGoogleCalendarAuth'
import { useTodayTasks, useTodayCompletions } from '../../hooks/useToday'
import { useTasks } from '../../hooks/useTasks'
import { CalendarView } from '../../components/CalendarView'
import { DaySheet } from '../../components/DaySheet'
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

  const { start, end } = getRangeForDate(currentDate, mode)
  const { isConnected, connect, disconnect, accessToken } = useGoogleCalendarAuth()

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
            <View style={[styles.legendDot, { backgroundColor: '#639922' }]} />
            <Text style={styles.legendText}>Tasks</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59F0A' }]} />
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

        {/* Integrations */}
        <View style={styles.integrations}>
          <Text style={styles.integrationsTitle}>Calendar integrations</Text>

          {/* Google Calendar */}
          <View style={styles.integrationRow}>
            <View style={styles.integrationInfo}>
              <View style={[styles.integrationIcon, { backgroundColor: '#E8F0FE' }]}>
                <Text style={styles.integrationIconText}>G</Text>
              </View>
              <View>
                <Text style={styles.integrationName}>Google Calendar</Text>
                <Text style={styles.integrationStatus}>
                  {isConnected ? 'Connected' : 'Not connected'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.integrationBtn, isConnected && styles.integrationBtnDanger]}
              onPress={isConnected ? disconnect : connect}
              activeOpacity={0.7}
            >
              <Text style={[styles.integrationBtnText, isConnected && styles.integrationBtnTextDanger]}>
                {isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Apple Calendar (iOS only) */}
          {Platform.OS === 'ios' && (
            <View style={styles.integrationRow}>
              <View style={styles.integrationInfo}>
                <View style={[styles.integrationIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.integrationIconText}></Text>
                </View>
                <View>
                  <Text style={styles.integrationName}>Apple Calendar</Text>
                  <Text style={styles.integrationStatus}>
                    Auto-synced on iOS
                  </Text>
                </View>
              </View>
              <View style={styles.integrationConnected}>
                <Text style={styles.integrationConnectedText}>Active</Text>
              </View>
            </View>
          )}
        </View>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F4' },
  content: { paddingHorizontal: 24, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 20,
  },
  title: {
    fontSize: 28, fontWeight: '700', color: '#1C1917',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1EFE8',
    borderRadius: 10,
    padding: 3,
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: '#FFFFFF' },
  modeBtnText: { fontSize: 13, color: '#A8A29E', fontWeight: '500' },
  modeBtnTextActive: { color: '#1C1917' },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#A8A29E' },
  integrations: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 16,
    gap: 4,
  },
  integrationsTitle: {
    fontSize: 11, fontWeight: '600', color: '#A8A29E',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 12,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3EF',
  },
  integrationInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  integrationIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  integrationIconText: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  integrationName: { fontSize: 14, fontWeight: '500', color: '#1C1917' },
  integrationStatus: { fontSize: 12, color: '#A8A29E', marginTop: 1 },
  integrationBtn: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 100, borderWidth: 1, borderColor: '#E7E5E4',
  },
  integrationBtnDanger: { borderColor: '#F09595' },
  integrationBtnText: { fontSize: 13, color: '#1C1917', fontWeight: '500' },
  integrationBtnTextDanger: { color: '#E24B4A' },
  integrationConnected: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 100, backgroundColor: '#EAF3DE',
  },
  integrationConnectedText: { fontSize: 13, color: '#3B6D11', fontWeight: '500' },
})