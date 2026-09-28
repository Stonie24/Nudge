import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()

  async function pickAndUpload() {
    if (!user) return

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      throw new Error('Photo library permission is required to choose a picture.')
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    setUploading(true)
    try {
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: asset.mimeType ?? `image/${ext}`, upsert: true })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { custom_avatar_url: publicUrlData.publicUrl },
      })
      if (updateError) throw updateError
    } finally {
      setUploading(false)
    }
  }

  return { uploading, pickAndUpload }
}
