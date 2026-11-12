import React, { useMemo, useRef, useState } from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { TagPicker } from './TagPicker'
import { useAddTodayTask } from '../hooks/useToday'
import { triggerHaptic } from '../hooks/useAnimation'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'

/**
 * Inline quick-add for the Today board. Type, hit return, keep typing —
 * the field stays focused so several tasks can be added in a row. Tag and
 * "repeat daily" stick between adds; the overflow button opens the full
 * Add Task sheet (backlog, etc.) carrying over whatever was typed.
 */
export function QuickAddBar({ onOpenFullSheet }: { onOpenFullSheet: (draftTitle: string) => void }) {
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState<string | undefined>()
  const [recurring, setRecurring] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const addTodayTask = useAddTodayTask()

  const canSubmit = title.trim().length > 0

  function submit() {
    const t = title.trim()
    if (!t) return
    // Fire and forget: the mutation inserts an optimistic row immediately,
    // and queues while offline, so there's nothing to wait for here.
    addTodayTask.mutate({ title: t, tag, recurring })
    triggerHaptic('light')
    setTitle('')
    inputRef.current?.focus()
  }

  function openFullSheet() {
    onOpenFullSheet(title.trim())
    setTitle('')
  }

  return (
    <View style={[styles.bar, focused && styles.barFocused]}>
      <View style={styles.inputRow}>
        <Icon name="plus" size={16} color={focused ? colors.accent : colors.textMuted} strokeWidth={2.2} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Add a task for today…"
          placeholderTextColor={colors.placeholder}
          value={title}
          onChangeText={setTitle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={submit}
          returnKeyType="done"
          // Keep the keyboard up after return so tasks can be added back to back.
          submitBehavior="submit"
          accessibilityLabel="New task title"
        />
        {canSubmit && (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel="Add task"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="check" size={16} color={colors.btnPrimaryText} strokeWidth={2.4} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.optionsRow}>
        <TagPicker value={tag} onChange={setTag} />
        <TouchableOpacity
          style={[styles.chip, recurring && styles.chipActive]}
          onPress={() => setRecurring(r => !r)}
          accessibilityRole="switch"
          accessibilityState={{ checked: recurring }}
          accessibilityLabel="Repeat daily"
          activeOpacity={0.7}
        >
          <Icon name="repeat" size={12} color={recurring ? colors.accentText : colors.textMuted} strokeWidth={2} />
          <Text style={[styles.chipText, recurring && styles.chipTextActive]}>Daily</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={openFullSheet}
          accessibilityRole="button"
          accessibilityLabel="More options and backlog"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="more" size={18} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    bar: {
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
      paddingBottom: space.md,
      marginBottom: space.xxl,
      gap: space.sm,
    },
    barFocused: { borderColor: c.accent },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    input: {
      flex: 1,
      height: 40,
      fontSize: 15,
      color: c.text,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    submitBtn: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: c.btnPrimary,
      alignItems: 'center', justifyContent: 'center',
    },
    optionsRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: space.xs,
      paddingVertical: space.xs, paddingHorizontal: space.sm,
      borderRadius: radius.pill, borderWidth: 1, borderColor: c.border,
    },
    chipActive: { backgroundColor: c.accentBg, borderColor: c.accent },
    chipText: { fontSize: 12, color: c.textMuted, fontWeight: '500' },
    chipTextActive: { color: c.accentText },
    spacer: { flex: 1 },
    moreBtn: { padding: space.xs },
  })
}
