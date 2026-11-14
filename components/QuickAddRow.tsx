import React, { useState, useMemo, useRef } from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Icon } from './Icon'
import { useAddTodayTask, newTaskId } from '../hooks/useToday'
import { useTheme } from '../lib/ThemeContext'
import { triggerHaptic } from '../hooks/useAnimation'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'

// Inline quick-add for the Today board. Enter adds a plain task to today and
// keeps focus so several can be typed in a row; the trailing button hands the
// current text to the full Add Task sheet for tags, repeat, or backlog.
// The text is owned by the parent so it survives opening and dismissing that sheet.
export function QuickAddRow({
  title,
  onChangeTitle: setTitle,
  onOpenSheet,
}: {
  title: string
  onChangeTitle: (title: string | ((current: string) => string)) => void
  onOpenSheet: () => void
}) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const addTodayTask = useAddTodayTask()

  function handleSubmit() {
    const t = title.trim()
    if (!t) return
    setTitle('')
    triggerHaptic('light')
    // The Today board renders pending adds straight away (usePendingTodayTasks),
    // so there's nothing to wait for here — online or offline.
    addTodayTask.mutate(
      { id: newTaskId(), title: t, recurring: false },
      { onError: () => setTitle(current => current || t) }
    )
  }

  function handleOpenSheet() {
    inputRef.current?.blur()
    onOpenSheet()
  }

  return (
    <View style={[styles.row, focused && styles.rowFocused]}>
      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Add a task"
      >
        <Icon name="plus" size={18} color={colors.accent} strokeWidth={2} />
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Add a task…"
        placeholderTextColor={colors.placeholder}
        value={title}
        onChangeText={setTitle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={handleSubmit}
        submitBehavior="submit"
        // react-native-web ignores submitBehavior and blurs single-line inputs on
        // Enter unless blurOnSubmit is false (no longer in RN's types, so spread).
        {...(Platform.OS === 'web' ? ({ blurOnSubmit: false } as object) : null)}
        returnKeyType="done"
        accessibilityLabel="New task title"
      />
      <TouchableOpacity
        style={styles.moreBtn}
        onPress={handleOpenSheet}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="More options: tag, repeat, or add from backlog"
      >
        <Icon name="more" size={18} color={colors.textMuted} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm,
      height: 48, backgroundColor: c.surface,
      borderWidth: 1, borderStyle: 'dashed', borderColor: c.textFaint,
      borderRadius: radius.md, paddingHorizontal: space.md,
      marginBottom: space.xxl,
    },
    rowFocused: { borderStyle: 'solid', borderColor: c.accentBorder },
    // minWidth: 0 lets the input shrink on web, where it otherwise keeps its
    // intrinsic width and pushes the ⋯ button outside the row.
    // outlineStyle 'none' (web only): Chrome ignores outlineWidth for its default
    // 'auto' focus ring, so it needs this to hide it; the row border shows focus.
    input: {
      flex: 1, minWidth: 0, height: '100%', fontSize: 15, color: c.text, outlineWidth: 0,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    moreBtn: { paddingHorizontal: space.xs },
  })
}
