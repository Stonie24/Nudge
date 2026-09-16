import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resumableMutation } from '../lib/resumableMutation'

export type Tag = {
  id: string
  name: string
  created_at: string
}

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

const addTag = resumableMutation('addTag', async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  // upsert so duplicate names don't error
  const { data, error } = await supabase
    .from('tags')
    .upsert({ name, user_id: user.id }, { onConflict: 'user_id,name' })
    .select()
    .single()
  if (error) throw error
  return data
})

export function useAddTag() {
  const queryClient = useQueryClient()
  return useMutation({
    ...addTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}

const deleteTag = resumableMutation('deleteTag', async (id: string) => {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
  if (error) throw error
})

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    ...deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}
