import React, { useState, useMemo } from 'react'
import {
    View,
    Text,
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
import { useAddTodayTask, useScheduleForToday } from '../hooks/useToday'
import { useTasks } from '../hooks/useTasks'
import { TagPicker, TagBadge } from './TagPicker'
import { getTagColor } from '../lib/tagColor'
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

    const addTodayTask = useAddTodayTask()
    const scheduleForToday = useScheduleForToday()
    const { data: allTasks, isLoading } = useTasks()

    const backlog = useMemo(() => (
        allTasks?.filter(t =>
            !t.recurring && !todayTaskIds.includes(t.id) && !t.completed
        ) ?? []
    ), [allTasks, todayTaskIds])

    const backlogTags = useMemo(() => {
        const seen = new Set<string>()
        backlog.forEach(t => { if (t.tag) seen.add(t.tag) })
        return Array.from(seen)
    }, [backlog])

    const filteredBacklog = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()
        let result = backlog
        if (normalizedSearch) result = result.filter(t => t.title.toLowerCase().includes(normalizedSearch))
        if (selectedTag) result = result.filter(t => t.tag === selectedTag)
        return result
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
                                placeholderTextColor="#A8A29E"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleAdd}
                            />

                            <TagPicker value={tag} onChange={setTag} />

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
                                    trackColor={{ false: '#E7E5E4', true: '#639922' }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
                                onPress={handleAdd}
                                disabled={!title.trim() || addTodayTask.isPending}
                                activeOpacity={0.8}
                            >
                                {addTodayTask.isPending
                                    ? <ActivityIndicator color="#FAF8F4" />
                                    : <Text style={styles.addBtnText}>Add to today</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.backlog}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search backlog..."
                                placeholderTextColor="#A8A29E"
                                value={search}
                                onChangeText={setSearch}
                                clearButtonMode="while-editing"
                                returnKeyType="search"
                            />

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
                                        const c = getTagColor(t)
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
                                <ActivityIndicator color="#639922" style={styles.loader} />
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
                                            <Text style={styles.addIcon}>+</Text>
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
        maxHeight: '85%',
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: '#E7E5E4',
        alignSelf: 'center', marginBottom: 20,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#F1EFE8',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1, paddingVertical: 8,
        borderRadius: 10, alignItems: 'center',
    },
    tabActive: { backgroundColor: '#FFFFFF' },
    tabText: { fontSize: 14, color: '#A8A29E', fontWeight: '500' },
    tabTextActive: { color: '#1C1917' },
    newTask: { gap: 16 },
    input: {
        height: 50, backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E7E5E4',
        borderRadius: 12, paddingHorizontal: 16,
        fontSize: 15, color: '#1C1917',
    },
    recurringRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 12,
        borderWidth: 1, borderColor: '#E7E5E4',
        padding: 14, gap: 12,
    },
    recurringLabel: { flex: 1 },
    recurringTitle: { fontSize: 15, color: '#1C1917', fontWeight: '500' },
    recurringHint: { fontSize: 12, color: '#A8A29E', marginTop: 2 },
    addBtn: {
        height: 52, backgroundColor: '#1C1917',
        borderRadius: 100, alignItems: 'center', justifyContent: 'center',
    },
    addBtnDisabled: { backgroundColor: '#E7E5E4' },
    addBtnText: { color: '#FAF8F4', fontSize: 15, fontWeight: '500' },
    backlog: { gap: 12 },
    searchInput: {
        height: 44, backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E7E5E4',
        borderRadius: 12, paddingHorizontal: 16,
        fontSize: 14, color: '#1C1917',
    },
    tagRow: { flexGrow: 0 },
    tagRowContent: { flexDirection: 'row', gap: 8 },
    tagAllChip: {
        paddingVertical: 6, paddingHorizontal: 14,
        borderRadius: 100, borderWidth: 1,
        borderColor: '#E7E5E4', backgroundColor: '#FFFFFF',
    },
    tagAllChipActive: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
    tagAllChipText: { fontSize: 12, color: '#78716C', fontWeight: '500' },
    tagAllChipTextActive: { color: '#FAF8F4' },
    tagChip: {
        paddingVertical: 6, paddingHorizontal: 14,
        borderRadius: 100, borderWidth: 1.5,
    },
    tagChipActive: { borderWidth: 2.5 },
    tagChipText: { fontSize: 12, fontWeight: '500' },
    backlogList: { maxHeight: 320 },
    backlogRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1,
        borderBottomColor: '#F5F3EF', gap: 12,
    },
    backlogText: { flex: 1, gap: 4 },
    backlogTitle: { fontSize: 15, color: '#1C1917' },
    addIcon: { fontSize: 22, color: '#639922', fontWeight: '300' },
    loader: { marginTop: 40 },
    emptyText: {
        fontSize: 14, color: '#A8A29E',
        textAlign: 'center', marginTop: 40, lineHeight: 22,
    },
})
