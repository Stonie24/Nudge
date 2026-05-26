import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useTags, useAddTag, useDeleteTag } from '../hooks/useTags'
import { useTheme } from '../lib/ThemeContext'
import { getTagColor } from '../lib/tagColor'
import type { Colors } from '../lib/theme'

const PRESET_TAGS = ['Work', 'Personal', 'Focus', 'Health', 'Errands']

export function TagPicker({
  value,
  onChange,
}: {
  value?: string
  onChange: (tag: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')

  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const { data: savedTags, isLoading } = useTags()
  const addTag = useAddTag()
  const deleteTag = useDeleteTag()

  const color = value ? getTagColor(value) : null

  // Merge presets + saved custom tags, deduplicated
  const savedNames = savedTags?.map(t => t.name) ?? []
  const customTagNames = savedNames.filter(n => !PRESET_TAGS.includes(n))
  const allTags = [...PRESET_TAGS, ...customTagNames]

  function select(tag: string) {
    onChange(tag)
    setOpen(false)
    setCustom('')
  }

  function clearTag() {
    onChange(undefined)
    setOpen(false)
  }

  async function submitCustom() {
    const name = custom.trim()
    if (!name) return
    await addTag.mutateAsync(name)
    select(name)
  }

  async function handleDeleteTag(name: string) {
    const tag = savedTags?.find(t => t.name === name)
    if (!tag) return
    await deleteTag.mutateAsync(tag.id)
    if (value === name) onChange(undefined)
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          color ? { backgroundColor: color.bg, borderColor: color.border } : null,
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, color ? { color: color.text } : null]}>
          {value ?? '# tag'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a tag</Text>

            {isLoading ? (
              <ActivityIndicator style={styles.loader} color={colors.accent} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.tagsScroll}>
                <View style={styles.presets}>
                  {allTags.map(tag => {
                    const c = getTagColor(tag)
                    const isActive = value === tag
                    const isCustom = !PRESET_TAGS.includes(tag)
                    return (
                      <View key={tag} style={styles.tagWrapper}>
                        <TouchableOpacity
                          style={[
                            styles.preset,
                            { backgroundColor: c.bg, borderColor: c.border },
                            isActive && styles.presetActive,
                          ]}
                          onPress={() => select(tag)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.presetText, { color: c.text }]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                        {isCustom && (
                          <TouchableOpacity
                            style={styles.removeTag}
                            onPress={() => handleDeleteTag(tag)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.removeTagText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            )}

            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="New custom tag..."
                placeholderTextColor={colors.placeholder}
                value={custom}
                onChangeText={setCustom}
                onSubmitEditing={submitCustom}
                returnKeyType="done"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.customBtn, (!custom.trim() || addTag.isPending) && styles.customBtnDisabled]}
                onPress={submitCustom}
                disabled={!custom.trim() || addTag.isPending}
                activeOpacity={0.8}
              >
                {addTag.isPending
                  ? <ActivityIndicator color={colors.btnPrimaryText} size="small" />
                  : <Text style={styles.customBtnText}>Add</Text>
                }
              </TouchableOpacity>
            </View>

            {value && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearTag} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Remove tag</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

export function TagBadge({ tag }: { tag: string }) {
  const color = getTagColor(tag)
  return (
    <View style={[badgeStyles.badge, { backgroundColor: color.bg, borderColor: color.border }]}>
      <Text style={[badgeStyles.badgeText, { color: color.text }]}>{tag}</Text>
    </View>
  )
}

// TagBadge uses tag-specific colors, no theme dependency needed
const badgeStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
})

function createStyles(c: Colors) {
  return StyleSheet.create({
    trigger: {
      height: 48,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    triggerText: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '500',
    },
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
      paddingBottom: 40,
      maxHeight: '80%',
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginBottom: 16,
    },
    loader: {
      marginVertical: 20,
    },
    tagsScroll: {
      maxHeight: 160,
      marginBottom: 16,
    },
    presets: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagWrapper: {
      position: 'relative',
    },
    preset: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 100,
      borderWidth: 1.5,
    },
    presetActive: {
      borderWidth: 2.5,
    },
    presetText: {
      fontSize: 14,
      fontWeight: '500',
    },
    removeTag: {
      position: 'absolute',
      top: -6,
      right: -4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeTagText: {
      fontSize: 11,
      color: c.textSecondary,
      lineHeight: 14,
      fontWeight: '600',
    },
    customRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    customInput: {
      flex: 1,
      height: 44,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      fontSize: 14,
      color: c.text,
    },
    customBtn: {
      height: 44,
      paddingHorizontal: 16,
      backgroundColor: c.btnPrimary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customBtnDisabled: {
      backgroundColor: c.btnDisabled,
    },
    customBtnText: {
      color: c.btnPrimaryText,
      fontSize: 14,
      fontWeight: '500',
    },
    clearBtn: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    clearBtnText: {
      fontSize: 14,
      color: '#E24B4A',
      fontWeight: '500',
    },
  })
}
