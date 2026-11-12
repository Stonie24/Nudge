import React, { useState, useMemo } from 'react'
import {
    View,
    TextInput,
    TouchableOpacity,
    Modal,
    Pressable,
    StyleSheet,
    FlatList,
    ScrollView,
    ActivityIndicator,
    Switch,
} from 'react-native'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { useAddTodayTask, useScheduleForToday } from '../hooks/useToday'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../lib/ThemeContext'
import { TagPicker, TagBadge } from './TagPicker'
import { getTagColor } from '../lib/tagColor'
import type { Colors } from '../lib/theme'
import { space, radius, shadow } from '../lib/theme'
import type { Task } from '../types'

type Tab = 'new' | 'backlog'

export function AddTaskSheet({
    visible,
    onClose,
    todayTaskIds,
}: {
    visible: boolean
    onClose: () => void
    todayTaskIds: string[]
}) {
    const [tab, setTab] = useState<Tab>('new')
    const [title, setTitle] = useState('')
    const [tag, setTag] = useState<string | undefined>()
    const [recurring, setRecurring] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | undefined>()

    const { colors, isDark } = useTheme()
    const styles = useMemo(() => createStyles(colors), [colors])

    const addTodayTask = useAddTodayTask()
    const scheduleForToday = useScheduleForToday()
    const { data: allTasks, isLoading } = useTasks()

    const backlog = useMemo(() => (
        allTasks?.filter(t =>
            !t.recurring && !todayTaskIds.includes(t.id) && !t.completed
        ) ?? []
    ), [allTasks, todayTaskIds])

    const backlogTags = useMemo(
        () => Array.from(
            backlog.reduce((seen, task) => {
                if (task.tag) seen.add(task.tag)
                return seen
            }, new Set<string>())
        ),
        [backlog]
    )

    const filteredBacklog = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()
        return backlog.filter(task =>
            (!normalizedSearch || task.title.toLowerCase().includes(normalizedSearch)) &&
            (!selectedTag || task.tag === selectedTag)
        )
    }, [backlog, search, selectedTag])

    function reset() {
        setTitle('')
        setTag(undefined)
        setRecurring(false)
        setTab('new')
        setSearch('')
        setSelectedTag(undefined)
    }

    function handleClose() {
        reset()
        onClose()
    }

    async function handleAdd() {
        const t = title.trim()
        if (!t) return
        await addTodayTask.mutateAsync({ title: t, tag, recurring })
        reset()
        onClose()
    }

    async function handleSchedule(task: Task) {
        await scheduleForToday.mutateAsync(task.id)
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

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, tab === 'new' && styles.tabActive]}
                            onPress={() => setTab('new')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>
                                New task
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, tab === 'backlog' && styles.tabActive]}
                            onPress={() => setTab('backlog')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, tab === 'backlog' && styles.tabTextActive]}>
                                From backlog
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {tab === 'new' ? (
                        <View style={styles.newTask}>
                            <TextInput
                                style={styles.input}
                                placeholder="What do you need to do?"
                                placeholderTextColor={colors.placeholder}
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleAdd}
                            />

                            <TagPicker value={tag} onChange={setTag} />

                            {/* Recurring toggle */}
                            <View style={styles.recurringRow}>
                                <View style={styles.recurringLabel}>
                                    <Text style={styles.recurringTitle}>Repeat daily</Text>
                                    <Text style={styles.recurringHint}>
                                        This task will reset every day at midnight
                                    </Text>
                                </View>
                                <Switch
                                    value={recurring}
                                    onValueChange={setRecurring}
                                    trackColor={{ false: colors.border, true: colors.accent }}
                                    thumbColor={colors.surface}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
                                onPress={handleAdd}
                                disabled={!title.trim() || addTodayTask.isPending}
                                activeOpacity={0.8}
                            >
                                {addTodayTask.isPending
                                    ? <ActivityIndicator color={colors.btnPrimaryText} />
                                    : <Text style={styles.addBtnText}>Add to today</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.backlog}>
                            <View style={styles.searchRow}>
                                <Icon name="search" size={16} color={colors.textMuted} strokeWidth={2} style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search backlog..."
                                    placeholderTextColor={colors.placeholder}
                                    value={search}
                                    onChangeText={setSearch}
                                    clearButtonMode="while-editing"
                                    returnKeyType="search"
                                />
                            </View>

                            {backlogTags.length > 0 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.tagRow}
                                    contentContainerStyle={styles.tagRowContent}
                                >
                                    <TouchableOpacity
                                        style={[styles.tagAllChip, !selectedTag && styles.tagAllChipActive]}
                                        onPress={() => setSelectedTag(undefined)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.tagAllChipText, !selectedTag && styles.tagAllChipTextActive]}>
                                            All
                                        </Text>
                                    </TouchableOpacity>
                                    {backlogTags.map(t => {
                                        const c = getTagColor(t, isDark)
                                        const isActive = selectedTag === t
                                        return (
                                            <TouchableOpacity
                                                key={t}
                                                style={[
                                                    styles.tagChip,
                                                    { backgroundColor: c.bg, borderColor: c.border },
                                                    isActive && styles.tagChipActive,
                                                ]}
                                                onPress={() => setSelectedTag(isActive ? undefined : t)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.tagChipText, { color: c.text }]}>{t}</Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </ScrollView>
                            )}

                            {isLoading ? (
                                <ActivityIndicator color={colors.accent} style={styles.loader} />
                            ) : filteredBacklog.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    {backlog.length === 0
                                        ? 'No backlog tasks — everything is already on today\'s board or completed!'
                                        : 'No tasks match your search.'
                                    }
                                </Text>
                            ) : (
                                <FlatList
                                    data={filteredBacklog}
                                    keyExtractor={item => item.id}
                                    style={styles.backlogList}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.backlogRow}
                                            onPress={() => handleSchedule(item)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.backlogText}>
                                                <Text style={styles.backlogTitle}>{item.title}</Text>
                                                {item.tag && <TagBadge tag={item.tag} />}
                                            </View>
                                            <Icon name="plus" size={18} color={colors.accent} strokeWidth={2} />
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                    )}
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
            maxHeight: '85%',
            ...shadow.lg,
        },
        handle: {
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: c.border,
            alignSelf: 'center', marginBottom: space.xl,
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: c.surfaceAlt,
            borderRadius: radius.md,
            padding: space.xs,
            marginBottom: space.xxl,
        },
        tab: {
            flex: 1, paddingVertical: space.sm,
            borderRadius: radius.sm, alignItems: 'center',
        },
        tabActive: { backgroundColor: c.surface },
        tabText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
        tabTextActive: { color: c.text },
        newTask: { gap: space.lg },
        input: {
            height: 50, backgroundColor: c.inputBg,
            borderWidth: 1, borderColor: c.border,
            borderRadius: radius.md, paddingHorizontal: space.lg,
            fontSize: 15, color: c.text,
        },
        recurringRow: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.inputBg, borderRadius: radius.md,
            borderWidth: 1, borderColor: c.border,
            padding: space.md, gap: space.md,
        },
        recurringLabel: { flex: 1 },
        recurringTitle: { fontSize: 15, color: c.text, fontWeight: '500' },
        recurringHint: { fontSize: 12, color: c.textMuted, marginTop: 2 },
        addBtn: {
            height: 52, backgroundColor: c.btnPrimary,
            borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
        },
        addBtnDisabled: { backgroundColor: c.btnDisabled },
        addBtnText: { color: c.btnPrimaryText, fontSize: 15, fontWeight: '500' },
        backlog: { gap: space.md },
        searchRow: { justifyContent: 'center' },
        searchIcon: { position: 'absolute', left: space.lg, zIndex: 1 },
        searchInput: {
            height: 44, backgroundColor: c.inputBg,
            borderWidth: 1, borderColor: c.border,
            borderRadius: radius.md, paddingLeft: space.lg + 16 + space.sm, paddingRight: space.lg,
            fontSize: 14, color: c.text,
        },
        tagRow: { flexGrow: 0 },
        tagRowContent: { flexDirection: 'row', gap: space.sm },
        tagAllChip: {
            paddingVertical: space.sm, paddingHorizontal: space.md,
            borderRadius: radius.pill, borderWidth: 1,
            borderColor: c.border, backgroundColor: c.surface,
        },
        tagAllChipActive: { backgroundColor: c.btnPrimary, borderColor: c.btnPrimary },
        tagAllChipText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
        tagAllChipTextActive: { color: c.btnPrimaryText },
        tagChip: {
            paddingVertical: space.sm, paddingHorizontal: space.md,
            borderRadius: radius.pill, borderWidth: 1.5,
        },
        tagChipActive: { borderWidth: 2.5 },
        tagChipText: { fontSize: 12, fontWeight: '500' },
        backlogList: { maxHeight: 320 },
        backlogRow: {
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: space.md, borderBottomWidth: 1,
            borderBottomColor: c.borderLight, gap: space.md,
        },
        backlogText: { flex: 1, gap: space.xs },
        backlogTitle: { fontSize: 15, color: c.text },
        loader: { marginTop: 40 },
        emptyText: {
            fontSize: 14, color: c.textMuted,
            textAlign: 'center', marginTop: 40, lineHeight: 22,
        },
    })
}
