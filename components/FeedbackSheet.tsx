import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'
import { showAlert } from '../lib/alert'
import type { Colors } from '../lib/theme'

export function FeedbackSheet({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  function reset() {
    setTitle('')
    setBody('')
    setLoading(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!body.trim()) return
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const { data, error } = await supabase.functions.invoke('submit-feedback', {
        body: { title: title.trim() || undefined, body: body.trim() },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (error || !data?.url) throw new Error(error?.message ?? 'Unknown error')
      reset()
      onClose()
      showAlert(
        'Thanks for your feedback!',
        'Your report has been submitted. Would you like to track it on GitHub?',
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'View issue', onPress: () => Linking.openURL(data.url) },
        ]
      )
    } catch (e) {
      setLoading(false)
      showAlert('Failed to send', 'Something went wrong. Please try again.')
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>Send feedback</Text>
          <Text style={styles.subtitle}>
            Your message will be submitted as an issue on our GitHub tracker.
          </Text>

          <View style={styles.fields}>
            <TextInput
              style={styles.input}
              placeholder="Title (optional)"
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              autoCapitalize="sentences"
            />
            <TextInput
              style={[styles.input, styles.bodyInput]}
              placeholder="Describe the issue or suggestion..."
              placeholderTextColor={colors.placeholder}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
              autoCapitalize="sentences"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!body.trim() || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!body.trim() || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={colors.btnPrimaryText} />
              : <Text style={styles.submitBtnText}>Submit feedback</Text>
            }
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 48,
      gap: 16,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center', marginBottom: 4,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
    },
    subtitle: {
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 18,
      marginTop: -8,
    },
    fields: { gap: 12 },
    input: {
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontSize: 15,
      color: c.text,
    },
    bodyInput: {
      minHeight: 120,
    },
    submitBtn: {
      height: 52,
      backgroundColor: c.btnPrimary,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnDisabled: { backgroundColor: c.btnDisabled },
    submitBtnText: {
      color: c.btnPrimaryText,
      fontSize: 15,
      fontWeight: '500',
    },
  })
}
