import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
const GITHUB_REPO = 'Stonie24/Nudge'
const JWT_BASE64URL_PART_REGEX = /^[A-Za-z0-9_-]+$/

// Optional allowlist — comma-separated origins, e.g.
//   "https://nudge.app,http://localhost:8081"
// If unset, CORS is permissive ("*"). Fine for dev; set this in production.
const ALLOWED_ORIGINS: Set<string> | null = (() => {
  const raw = Deno.env.get('FEEDBACK_ALLOWED_ORIGIN')
  if (!raw) {
    console.warn('submit-feedback: FEEDBACK_ALLOWED_ORIGIN not set; CORS is permissive ("*").')
    return null
  }
  return new Set(raw.split(',').map(o => o.trim()).filter(Boolean))
})()

/** Returns the echoed origin, '*' if no allowlist, or null to deny. */
function resolveOrigin(req: Request): string | null {
  const origin = req.headers.get('Origin') ?? ''
  if (!ALLOWED_ORIGINS) return '*'
  if (ALLOWED_ORIGINS.has(origin)) return origin
  return null
}

function hasJwtShape(token: string) {
  const parts = token.split('.')
  return parts.length === 3 &&
    parts.every((part) =>
      part.length > 0 &&
      JWT_BASE64URL_PART_REGEX.test(part) &&
      isBase64UrlDecodable(part)
    )
}

function isBase64UrlDecodable(part: string) {
  try {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(part.length / 4) * 4, '=')
    atob(padded)
    return true
  } catch {
    return false
  }
}

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(data: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  // Resolve origin FIRST — unknown origins are denied before CORS headers are
  // ever returned, including on OPTIONS preflight. This means the browser's
  // preflight itself fails for disallowed origins rather than succeeding and
  // then hitting a 403 on the actual POST.
  const origin = resolveOrigin(req)
  if (origin === null) {
    console.warn('submit-feedback: rejected disallowed origin', req.headers.get('Origin'))
    return new Response(null, { status: 403 })
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405, headers: { ...getCorsHeaders(origin), Allow: 'POST' } })
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
    if (!jwt || !hasJwtShape(jwt)) {
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
