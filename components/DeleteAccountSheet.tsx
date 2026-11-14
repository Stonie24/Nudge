import React, { useState, useMemo } from 'react'
import { View, TouchableOpacity, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { AppText as Text } from './AppText'
import { InlineFormError } from './InlineFormError'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space, radius, shadow } from '../lib/theme'

const WHAT_GETS_DELETED = [
  'All your tasks, tags and daily streaks',
  'Your profile picture',
  'Your Google Calendar connection',
  'Your login, so you can no longer sign in',
]

/**
 * Confirmation step for permanently deleting the account. The sheet itself is
 * the confirmation: it spells out what goes, and the destructive button is
 * the only way forward. Errors show inline so the user can retry.
 */
export function DeleteAccountSheet({
  visible,
  email,
  onClose,
  onConfirm,
}: {
  visible: boolean
  email?: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  function handleClose() {
    if (deleting) return // don't dismiss mid-request
    setError(null)
    onClose()
  }

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      await onConfirm()
      // On success the user is signed out and the app leaves this screen.
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't delete your account. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>Delete your account?</Text>
          <Text style={styles.subtitle}>
            {email ? `This permanently deletes ${email} and everything in it. ` : 'This permanently deletes your account. '}
            It can't be undone.
          </Text>

          <View style={styles.list}>
            {WHAT_GETS_DELETED.map(item => (
              <View key={item} style={styles.listRow}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <InlineFormError message={error} />

          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnBusy]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Delete my account permanently"
          >
            {deleting
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.deleteBtnText}>Delete my account</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            disabled={deleting}
            activeOpacity={0.6}
            accessibilityRole="button"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      padding: space.xxl,
      paddingBottom: 48,
      gap: space.lg,
      ...shadow.lg,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center', marginBottom: space.xs,
    },
    title: { fontSize: 17, fontWeight: '600', color: c.text },
    subtitle: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginTop: -8 },
    list: {
      backgroundColor: c.dangerBg,
      borderRadius: radius.md,
      padding: space.lg,
      gap: space.sm,
    },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.danger },
    listText: { fontSize: 14, color: c.text, lineHeight: 20, flex: 1 },
    deleteBtn: {
      height: 52,
      backgroundColor: c.danger,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtnBusy: { opacity: 0.7 },
    deleteBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    cancelBtn: { alignItems: 'center', paddingVertical: space.sm },
    cancelBtnText: { fontSize: 15, color: c.textSecondary, fontWeight: '500' },
  })
}
