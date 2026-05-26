import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
const GITHUB_REPO = 'Stonie24/Nudge'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Fail fast if misconfigured — logged server-side only
  if (!GITHUB_TOKEN) {
    console.error('submit-feedback: GITHUB_TOKEN secret is not set')
    return json({ error: 'Service misconfigured' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const { title, body } = await req.json()
    if (!body?.trim()) return json({ error: 'Feedback body is required' }, 400)

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
      return json({ error: 'Failed to create issue' }, 502)
    }

    const issue = await ghRes.json()
    return json({ url: issue.html_url, number: issue.number }, 201)
  } catch (e) {
    console.error('submit-feedback: unhandled error', e)
    return json({ error: 'Internal server error' }, 500)
  }
})
