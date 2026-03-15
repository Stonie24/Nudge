import React, { useState } from 'react'
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
import { getTagColor } from '../lib/tagColor'

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
              <ActivityIndicator style={styles.loader} color="#639922" />
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
                placeholderTextColor="#A8A29E"
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
                  ? <ActivityIndicator color="#FAF8F4" size="small" />
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
    <View style={[styles.badge, { backgroundColor: color.bg, borderColor: color.border }]}>
      <Text style={[styles.badgeText, { color: color.text }]}>{tag}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  trigger: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 13,
    color: '#A8A29E',
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF8F4',
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
    backgroundColor: '#E7E5E4',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
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
    backgroundColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTagText: {
    fontSize: 11,
    color: '#57534E',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1C1917',
  },
  customBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#1C1917',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBtnDisabled: {
    backgroundColor: '#E7E5E4',
  },
  customBtnText: {
    color: '#FAF8F4',
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