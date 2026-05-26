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
    ActivityIndicator,
    Switch,
} from 'react-native'
import { useAddTodayTask, useScheduleForToday } from '../hooks/useToday'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../lib/ThemeContext'
import { TagPicker, TagBadge } from './TagPicker'
import type { Colors } from '../lib/theme'
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

    const { colors } = useTheme()
    const styles = useMemo(() => createStyles(colors), [colors])

    const addTodayTask = useAddTodayTask()
    const scheduleForToday = useScheduleForToday()
    const { data: allTasks, isLoading } = useTasks()

    // Backlog = tasks not already on today's board and not recurring
    const backlog = allTasks?.filter(t =>
        !t.recurring && !todayTaskIds.includes(t.id) && !t.completed
    ) ?? []

    function reset() {
        setTitle('')
        setTag(undefined)
        setRecurring(false)
        setTab('new')
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
                            {isLoading ? (
                                <ActivityIndicator color={colors.accent} style={styles.loader} />
                            ) : backlog.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    No backlog tasks — everything is already on today's board or completed!
                                </Text>
                            ) : (
                                <FlatList
                                    data={backlog}
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
            maxHeight: '85%',
        },
        handle: {
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: c.border,
            alignSelf: 'center', marginBottom: 20,
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: c.surfaceAlt,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
        },
        tab: {
            flex: 1, paddingVertical: 8,
            borderRadius: 10, alignItems: 'center',
        },
        tabActive: { backgroundColor: c.surface },
        tabText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
        tabTextActive: { color: c.text },
        newTask: { gap: 16 },
        input: {
            height: 50, backgroundColor: c.inputBg,
            borderWidth: 1, borderColor: c.border,
            borderRadius: 12, paddingHorizontal: 16,
            fontSize: 15, color: c.text,
        },
        recurringRow: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.inputBg, borderRadius: 12,
            borderWidth: 1, borderColor: c.border,
            padding: 14, gap: 12,
        },
        recurringLabel: { flex: 1 },
        recurringTitle: { fontSize: 15, color: c.text, fontWeight: '500' },
        recurringHint: { fontSize: 12, color: c.textMuted, marginTop: 2 },
        addBtn: {
            height: 52, backgroundColor: c.btnPrimary,
            borderRadius: 100, alignItems: 'center', justifyContent: 'center',
        },
        addBtnDisabled: { backgroundColor: c.btnDisabled },
        addBtnText: { color: c.btnPrimaryText, fontSize: 15, fontWeight: '500' },
        backlog: { minHeight: 200 },
        backlogList: { maxHeight: 400 },
        backlogRow: {
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 14, borderBottomWidth: 1,
            borderBottomColor: c.borderLight, gap: 12,
        },
        backlogText: { flex: 1, gap: 4 },
        backlogTitle: { fontSize: 15, color: c.text },
        addIcon: { fontSize: 22, color: c.accent, fontWeight: '300' },
        loader: { marginTop: 40 },
        emptyText: {
            fontSize: 14, color: c.textMuted,
            textAlign: 'center', marginTop: 40, lineHeight: 22,
        },
    })
}
