import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ExpoCalendar from 'expo-calendar'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import type { CalendarEvent } from '../types'

// Fetch Nudge events from Supabase for a date range
export function useNudgeEvents(startDate: string, endDate: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['events', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true })
      if (error) throw error
      return data.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start_time: e.start_time,
        end_time: e.end_time,
        all_day: e.all_day,
        color: e.color,
        source: 'nudge' as const,
      }))
    },
  })
}

// Fetch Google Calendar events
export function useGoogleEvents(
  startDate: string,
  endDate: string,
  accessToken?: string
) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['google_events', startDate, endDate],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams({
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      })
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const data = await res.json()
      if (!data.items) return []
      return data.items.map((item: any) => ({
        id: item.id,
        title: item.summary ?? '(No title)',
        description: item.description,
        start_time: item.start.dateTime ?? item.start.date,
        end_time: item.end.dateTime ?? item.end.date,
        all_day: !!item.start.date && !item.start.dateTime,
        color: '#4285F4',
        source: 'google' as const,
        external_id: item.id,
      }))
    },
  })
}

// Fetch Apple Calendar events (iOS only)
export function useAppleEvents(startDate: string, endDate: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['apple_events', startDate, endDate],
    enabled: Platform.OS === 'ios',
    queryFn: async () => {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync()
      if (status !== 'granted') return []

      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT)
      const calendarIds = calendars.map(c => c.id)

      const events = await ExpoCalendar.getEventsAsync(
        calendarIds,
        new Date(startDate),
        new Date(endDate)
      )

      return events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.notes ?? undefined,
        start_time: e.startDate.toString(),
        end_time: e.endDate.toString(),
        all_day: e.allDay,
        color: '#FF9500',
        source: 'apple' as const,
        external_id: e.id,
      }))
    },
  })
}

// Add a manual Nudge event
export function useAddEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: {
      title: string
      description?: string
      start_time: string
      end_time: string
      all_day?: boolean
      color?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { data, error } = await supabase
        .from('events')
        .insert({ ...event, user_id: user.id, source: 'nudge' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

// Delete a Nudge event
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}