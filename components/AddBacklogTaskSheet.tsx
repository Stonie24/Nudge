import React, { useState } from 'react'
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
import { TagPicker } from './TagPicker'

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
              placeholderTextColor="#A8A29E"
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
              ? <ActivityIndicator color="#FAF8F4" />
              : <Text style={styles.addBtnText}>Add to backlog</Text>
            }
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF8F4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    gap: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E7E5E4',
    alignSelf: 'center', marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1917',
  },
  subtitle: {
    fontSize: 13,
    color: '#A8A29E',
    lineHeight: 18,
    marginTop: -8,
  },
  fields: {
    gap: 12,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1917',
  },
  addBtn: {
    height: 52,
    backgroundColor: '#1C1917',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#E7E5E4',
  },
  addBtnText: {
    color: '#FAF8F4',
    fontSize: 15,
    fontWeight: '500',
  },
})