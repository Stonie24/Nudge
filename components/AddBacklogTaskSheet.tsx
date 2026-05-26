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
} from 'react-native'
import { useAddTask } from '../hooks/useTasks'
import { useTheme } from '../lib/ThemeContext'
import { TagPicker } from './TagPicker'
import type { Colors } from '../lib/theme'

export function AddBacklogTaskSheet({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState<string | undefined>()
  const addTask = useAddTask()

  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  function reset() {
    setTitle('')
    setTag(undefined)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleAdd() {
    const t = title.trim()
    if (!t) return
    await addTask.mutateAsync({ title: t, tag })
    reset()
    onClose()
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

          <Text style={styles.title}>Add to backlog</Text>
          <Text style={styles.subtitle}>
            This task won't appear on today's board unless you schedule it.
          </Text>

          <View style={styles.fields}>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            <TagPicker value={tag} onChange={setTag} />
          </View>

          <TouchableOpacity
            style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!title.trim() || addTask.isPending}
            activeOpacity={0.8}
          >
            {addTask.isPending
              ? <ActivityIndicator color={colors.btnPrimaryText} />
              : <Text style={styles.addBtnText}>Add to backlog</Text>
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
    fields: {
      gap: 12,
    },
    input: {
      height: 50,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 15,
      color: c.text,
    },
    addBtn: {
      height: 52,
      backgroundColor: c.btnPrimary,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnDisabled: {
      backgroundColor: c.btnDisabled,
    },
    addBtnText: {
      color: c.btnPrimaryText,
      fontSize: 15,
      fontWeight: '500',
    },
  })
}
