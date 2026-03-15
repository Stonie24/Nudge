import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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

export function useAddTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}