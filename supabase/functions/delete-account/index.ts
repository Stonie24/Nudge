import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Permanently deletes the calling user's account and everything stored for it.
//
// Who to delete comes ONLY from the caller's verified JWT, never from the
// request body, so a user can only ever delete themselves. Deleting an auth
// user needs the service-role key, which is why this runs server-side.
//
// Order matters: user-owned rows and files are removed first, the auth user
// last. If anything fails part-way, the account still exists and the user can
// simply try again; nothing is left orphaned without an owner.

// Tables holding per-user rows. tasks / tags / daily_completions also cascade
// from auth.users, but events and google_calendar_tokens were created outside
// the migrations, so delete everything explicitly rather than rely on cascades.
// Children before parents: daily_completions references tasks.
const USER_TABLES = ['daily_completions', 'events', 'google_calendar_tokens', 'tasks', 'tags'] as const
const AVATAR_BUCKET = 'avatars'
const UNDEFINED_TABLE = '42P01'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(null, { status: 405, headers: { ...corsHeaders, Allow: 'POST' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('delete-account: Supabase env vars are not set')
    return json({ error: 'Service misconfigured' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    // Verify the caller with their own token.
    const asUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await asUser.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // Guard against accidental calls: the app sends this only from the
    // confirmation sheet.
    const body = await req.json().catch(() => ({}))
    if (body?.confirm !== 'DELETE') {
      return json({ error: 'Missing confirmation' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Profile pictures: stored under "<user_id>/..." and never cascaded.
    while (true) {
      const { data: files, error } = await admin.storage
        .from(AVATAR_BUCKET)
        .list(user.id, { limit: 100 })
      if (error) throw new Error(`list avatars: ${error.message}`)
      if (!files || files.length === 0) break
      const { error: removeError } = await admin.storage
        .from(AVATAR_BUCKET)
        .remove(files.map(f => `${user.id}/${f.name}`))
      if (removeError) throw new Error(`remove avatars: ${removeError.message}`)
    }

    // 2. Per-user rows.
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id)
      // A table that doesn't exist in this project has nothing to delete.
      if (error && error.code !== UNDEFINED_TABLE) {
        throw new Error(`delete ${table}: ${error.message}`)
      }
    }

    // 3. The account itself (hard delete, so the email can sign up again).
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw new Error(`delete user: ${deleteError.message}`)

    console.log('delete-account: deleted user', user.id)
    return json({ deleted: true }, 200)
  } catch (e) {
    console.error('delete-account: failed', e)
    return json({ error: 'Could not delete account' }, 500)
  }
})
