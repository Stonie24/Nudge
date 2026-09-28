import type { User } from '@supabase/supabase-js'

// Resolution order: a picture the user uploaded themselves, then whatever
// the OAuth provider (e.g. Google) supplied at sign-in, then no picture at
// all — callers fall back to an initials circle in that last case.
export function getAvatarUrl(user: User | null | undefined): string | null {
  const meta = user?.user_metadata ?? {}
  return meta.custom_avatar_url ?? meta.avatar_url ?? meta.picture ?? null
}
