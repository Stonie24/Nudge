import React, { useMemo, useRef, useState } from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { useTheme } from '../lib/ThemeContext'
import { addItem, removeItem, renameItem, toggleItem } from '../lib/checklist'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'
import type { ChecklistItem } from '../types'

// react-native-web ignores submitBehavior and blurs single-line inputs on
// Enter unless blurOnSubmit is false (no longer in RN's types, so spread).
const keepFocusOnSubmit = Platform.OS === 'web' ? ({ blurOnSubmit: false } as object) : null
const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null

/**
 * Flat checklist inside a task. Every change is handed to `onChange` straight
 * away (the parent saves it immediately), so ticks aren't lost if the sheet
 * is dismissed without pressing "Save changes".
 */
export function ChecklistSection({
  items,
  onChange,
}: {
  items: ChecklistItem[]
  onChange: (next: ChecklistItem[]) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [draft, setDraft] = useState('')
  const addRef = useRef<TextInput>(null)
  const done = items.filter(i => i.done).length

  function submitDraft() {
    const t = draft.trim()
    if (!t) return
    onChange(addItem(items, t))
    setDraft('')
    addRef.current?.focus()
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Checklist</Text>
        {items.length > 0 && (
          <Text style={styles.count} accessibilityLabel={`${done} of ${items.length} checklist items done`}>
            {done}/{items.length}
          </Text>
        )}
      </View>

      {items.map(item => (
        <ChecklistRow
          key={item.id}
          item={item}
          styles={styles}
          colors={colors}
          onToggle={() => onChange(toggleItem(items, item.id))}
          onRename={title => onChange(title ? renameItem(items, item.id, title) : removeItem(items, item.id))}
          onRemove={() => onChange(removeItem(items, item.id))}
        />
      ))}

      <View style={styles.addRow}>
        <Icon name="plus" size={14} color={colors.textMuted} strokeWidth={2.2} />
        <TextInput
          ref={addRef}
          style={[styles.addInput, noWebOutline]}
          value={draft}
          onChangeText={setDraft}
          placeholder={items.length ? 'Add another item…' : 'Add a checklist item…'}
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={submitDraft}
          submitBehavior="submit"
          {...keepFocusOnSubmit}
          returnKeyType="done"
          accessibilityLabel="New checklist item"
        />
      </View>
    </View>
  )
}

function ChecklistRow({
  item,
  styles,
  colors,
  onToggle,
  onRename,
  onRemove,
}: {
  item: ChecklistItem
  styles: ReturnType<typeof createStyles>
  colors: Colors
  onToggle: () => void
  onRename: (title: string) => void
  onRemove: () => void
}) {
  const [text, setText] = useState(item.title)
  // Keep in sync if the item changes from elsewhere (e.g. after a sync).
  const lastTitle = useRef(item.title)
  if (item.title !== lastTitle.current) {
    lastTitle.current = item.title
    if (text !== item.title) setText(item.title)
  }

  function commit() {
    const t = text.trim()
    if (t === item.title) return
    onRename(t) // empty title removes the item
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done }}
        accessibilityLabel={item.title}
      >
        <View style={[styles.box, item.done && styles.boxDone]}>
          {item.done && <Icon name="check" size={12} color={colors.btnPrimaryText} strokeWidth={2.6} />}
        </View>
      </TouchableOpacity>
      <TextInput
        style={[styles.itemInput, item.done && styles.itemInputDone, noWebOutline]}
        value={text}
        onChangeText={setText}
        // Enter ends editing (single-line inputs blur on submit), so blur is
        // the one place a rename is committed, on every platform.
        onBlur={commit}
        returnKeyType="done"
        accessibilityLabel={`Checklist item: ${item.title}`}
      />
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.title}`}
      >
        <Icon name="close" size={12} color={colors.textFaint} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    wrap: { gap: space.xs },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: {
      fontSize: 11, fontWeight: '600', color: c.textMuted,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    count: { fontSize: 12, fontWeight: '600', color: c.accent, fontVariant: ['tabular-nums'] },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm,
      paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.borderLight,
    },
    box: {
      width: 20, height: 20, borderRadius: 6,
      borderWidth: 1.5, borderColor: c.textFaint,
      alignItems: 'center', justifyContent: 'center',
    },
    boxDone: { backgroundColor: c.accent, borderColor: c.accent },
    itemInput: { flex: 1, minWidth: 0, fontSize: 15, color: c.text, paddingVertical: 4 },
    itemInputDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    addRow: {
      flexDirection: 'row', alignItems: 'center', gap: space.sm,
      paddingVertical: 4, paddingHorizontal: space.xs,
      borderRadius: radius.sm,
    },
    addInput: { flex: 1, minWidth: 0, fontSize: 15, color: c.text, paddingVertical: 6 },
  })
}
