import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
const GITHUB_REPO = 'Stonie24/Nudge'
const ALLOWED_ORIGIN = Deno.env.get('FEEDBACK_ALLOWED_ORIGIN')
const JWT_BASE64URL_PART_REGEX = /^[A-Za-z0-9_-]+$/

if (!ALLOWED_ORIGIN) {
  console.warn(
    'submit-feedback: FEEDBACK_ALLOWED_ORIGIN is not set; CORS origin is permissive ("*").'
  )
}

function hasJwtShape(token: string) {
  const parts = token.split('.')
  return parts.length === 3 &&
    parts.every((part) => part.length > 0 && JWT_BASE64URL_PART_REGEX.test(part))
}

function getCorsHeaders(origin: string | null, includeOrigin = true) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
  }

  if (!includeOrigin) return headers

  headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN || '*'
  return headers
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...getCorsHeaders(origin), Allow: 'POST' },
    })
  }

  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...getCorsHeaders(origin, false), 'Content-Type': 'application/json' },
    })
  }

  // Fail fast if misconfigured — logged server-side only
  if (!GITHUB_TOKEN) {
    console.error('submit-feedback: GITHUB_TOKEN secret is not set')
    return json({ error: 'Service misconfigured' }, 500, origin)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401, origin)
    }
    const jwt = authHeader.slice('Bearer '.length)
    if (!hasJwtShape(jwt)) {
      return json({ error: 'Unauthorized' }, 401, origin)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401, origin)

    const { title, body } = await req.json()
    if (!body?.trim()) return json({ error: 'Feedback body is required' }, 400, origin)

    const issueTitle = title?.trim() || 'User feedback'
    // user.id is a UUID — no PII exposed in the public issue
    const issueBody = `${body.trim()}\n\n---\n_Submitted via Nudge app · user ${user.id}_`

    const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title: issueTitle, body: issueBody, labels: ['feedback'] }),
    })

    if (!ghRes.ok) {
      console.error('submit-feedback: GitHub API error', ghRes.status, await ghRes.text())
      return json({ error: 'Failed to create issue' }, 502, origin)
    }

    const issue = await ghRes.json()
    return json({ url: issue.html_url, number: issue.number }, 201, origin)
  } catch (e) {
    console.error('submit-feedback: unhandled error', e)
    return json({ error: 'Internal server error' }, 500, origin)
  }
})
