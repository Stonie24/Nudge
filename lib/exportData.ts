import { Platform, Share } from 'react-native'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { toDateStr } from './dueDate'

// "Export my data": everything Nudge stores about the signed-in user, as one
// JSON file. Rows are read through the normal client, so RLS limits them to
// the user's own data. Google Calendar tokens are deliberately left out —
// they're credentials, not the user's content.

export const EXPORT_FORMAT_VERSION = 1

export type ExportTables = {
  tasks: unknown[]
  tags: unknown[]
  daily_completions: unknown[]
  events: unknown[]
}

export type NudgeExport = {
  app: 'Nudge'
  format_version: number
  exported_at: string
  account: {
    id: string
    email: string | null
    created_at: string | null
  }
  counts: Record<keyof ExportTables, number>
} & ExportTables

/** Pure: shapes fetched rows into the export document. */
export function buildExport(user: Pick<User, 'id' | 'email' | 'created_at'>, tables: ExportTables, now = new Date()): NudgeExport {
  return {
    app: 'Nudge',
    format_version: EXPORT_FORMAT_VERSION,
    exported_at: now.toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
    },
    counts: {
      tasks: tables.tasks.length,
      tags: tables.tags.length,
      daily_completions: tables.daily_completions.length,
      events: tables.events.length,
    },
    ...tables,
  }
}

export function exportFileName(now = new Date()): string {
  return `nudge-export-${toDateStr(now)}.json`
}

async function fetchAll(table: keyof ExportTables, orderBy: string): Promise<unknown[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order(orderBy, { ascending: true })
  if (error) throw new Error(`Couldn't read your ${table.replace('_', ' ')}: ${error.message}`)
  return data ?? []
}

export async function fetchExport(): Promise<NudgeExport> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const [tasks, tags, daily_completions, events] = await Promise.all([
    fetchAll('tasks', 'created_at'),
    fetchAll('tags', 'created_at'),
    fetchAll('daily_completions', 'completed_on'),
    fetchAll('events', 'start_time'),
  ])

  return buildExport(user, { tasks, tags, daily_completions, events })
}

/**
 * Hands the JSON to the user: a file download on web, the system share sheet
 * on iOS/Android (save to Files, AirDrop, email, etc.).
 */
export async function deliverExport(doc: NudgeExport): Promise<'downloaded' | 'shared' | 'dismissed'> {
  const json = JSON.stringify(doc, null, 2)
  const fileName = exportFileName(new Date(doc.exported_at))

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'downloaded'
  }

  const result = await Share.share({ title: fileName, message: json })
  return result.action === Share.dismissedAction ? 'dismissed' : 'shared'
}
