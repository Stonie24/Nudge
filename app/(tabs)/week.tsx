import React, { useMemo, useState } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import { AppText as Text } from '../../components/AppText'
import { Icon } from '../../components/Icon'
import { useTheme } from '../../lib/ThemeContext'
import { useWeekStats } from '../../hooks/useWeekStats'
import { useStreak } from '../../hooks/useStreak'
import { useLayout } from '../../hooks/useLayout'
import { getTagColor } from '../../lib/tagColor'
import { weekStartOf, formatWeekRange, type DayStats, type WeekStats } from '../../lib/weekly'
import { addDays, parseDateStr } from '../../lib/dueDate'
import type { Colors } from '../../lib/theme'
import { space, radius } from '../../lib/theme'
import { displayFont } from '../../lib/fonts'

const MAX_WEEKS_BACK = 52
const CHART_HEIGHT = 120
const COMPLETED_LIST_LIMIT = 8

const weekday = (date: string, style: 'short' | 'narrow' | 'long') =>
  parseDateStr(date).toLocaleDateString('en-SE', { weekday: style })
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`

export default function WeekScreen() {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { isDesktop } = useLayout()
  const thisWeek = weekStartOf(new Date())
  const [weeksBack, setWeeksBack] = useState(0)
  const weekStart = addDays(thisWeek, -7 * weeksBack)
  const { stats, isLoading } = useWeekStats(weekStart)
  const { streak } = useStreak()

  const title = weeksBack === 0 ? 'This week' : weeksBack === 1 ? 'Last week' : formatWeekRange(stats.start, stats.end)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.flip}><Icon name="chevron" size={16} color={colors.textMuted} strokeWidth={2} /></View>
          <Text style={styles.backText}>Today</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.range}>{formatWeekRange(stats.start, stats.end)}</Text>
          </View>
          <View style={styles.nav}>
            <NavButton
              label="Previous week"
              disabled={weeksBack >= MAX_WEEKS_BACK}
              onPress={() => setWeeksBack(w => w + 1)}
              flip
              colors={colors}
              styles={styles}
            />
            <NavButton
              label="Next week"
              disabled={weeksBack === 0}
              onPress={() => setWeeksBack(w => Math.max(0, w - 1))}
              colors={colors}
              styles={styles}
            />
          </View>
        </View>

        {isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (
          <>
            <View style={styles.tiles}>
              <StatTile
                value={String(stats.total)}
                label="Completed"
                sub={`${plural(stats.totalTasks, 'task')} · ${plural(stats.totalHabits, 'habit check-in')}`}
                styles={styles}
              />
              <StatTile
                value={stats.habits.length ? `${stats.perfectHabitDays}/${stats.elapsedDays}` : '–'}
                label="All habits done"
                sub={stats.habits.length ? 'days so far' : 'no daily habits yet'}
                styles={styles}
              />
              {weeksBack === 0 && (
                <StatTile value={String(streak)} label="Streak" sub={streak === 1 ? 'day' : 'days'} styles={styles} />
              )}
            </View>

            {stats.total === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>
                  {weeksBack === 0 ? 'Nothing completed yet this week' : 'Nothing completed this week'}
                </Text>
                <Text style={styles.muted}>
                  {weeksBack === 0 ? 'Tick off a task on Today and it shows up here.' : 'Try another week with the arrows above.'}
                </Text>
              </View>
            ) : (
              <>
                <DayChart stats={stats} colors={colors} styles={styles} />
                {stats.habits.length > 0 && <HabitGrid stats={stats} colors={colors} styles={styles} />}
                {stats.tags.length > 0 && <TagBars stats={stats} isDark={isDark} colors={colors} styles={styles} />}
                {stats.completedTasks.length > 0 && <CompletedList stats={stats} colors={colors} styles={styles} />}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function NavButton({ label, disabled, onPress, flip, colors, styles }: {
  label: string; disabled: boolean; onPress: () => void; flip?: boolean
  colors: Colors; styles: Styles
}) {
  return (
    <TouchableOpacity
      style={[styles.navBtn, disabled && styles.navBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <View style={flip ? styles.flip : undefined}>
        <Icon name="chevron" size={16} color={disabled ? colors.textFaint : colors.text} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  )
}

function StatTile({ value, label, sub, styles }: { value: string; label: string; sub: string; styles: Styles }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </View>
  )
}

/** Single-series bar chart: completions per day. Tap a bar for its breakdown. */
function DayChart({ stats, colors, styles }: { stats: WeekStats; colors: Colors; styles: Styles }) {
  const [selected, setSelected] = useState<string | null>(null)
  const max = Math.max(1, ...stats.days.map(d => d.total))
  const picked = stats.days.find(d => d.date === selected) ?? null
  // Selective labels: today and the best day only (plus whichever bar is tapped).
  const labelled = (d: DayStats) => d.total > 0 && (d.isToday || d.date === stats.bestDay?.date || d.date === selected)

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Completed per day</Text>
      <View style={[styles.chart, { height: CHART_HEIGHT + 20 }]} accessibilityRole="image"
        accessibilityLabel={stats.days.map(d => `${weekday(d.date, 'long')} ${d.total}`).join(', ')}>
        {stats.days.map(d => {
          const h = d.total > 0 ? Math.max(6, Math.round((d.total / max) * CHART_HEIGHT)) : 0
          const active = d.date === selected
          return (
            <TouchableOpacity
              key={d.date}
              style={styles.barSlot}
              onPress={() => setSelected(active ? null : d.date)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${weekday(d.date, 'long')}: ${d.total} completed`}
            >
              <Text style={[styles.barValue, !labelled(d) && styles.hidden]}>{d.total}</Text>
              {h > 0 ? (
                <View
                  style={[
                    styles.bar,
                    { height: h, backgroundColor: d.isToday || active ? colors.accent : colors.accentBorder },
                  ]}
                />
              ) : (
                <View style={[styles.barStub, d.isFuture && styles.barStubFuture]} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={styles.axis}>
        {stats.days.map(d => (
          <Text key={d.date} style={[styles.axisLabel, d.isToday && styles.axisLabelToday]}>
            {weekday(d.date, 'narrow')}
          </Text>
        ))}
      </View>
      <Text style={styles.chartNote}>
        {picked
          ? `${weekday(picked.date, 'long')}: ${plural(picked.tasks, 'task')}, ${plural(picked.habits, 'habit check-in')}`
          : stats.bestDay
            ? `Best day: ${weekday(stats.bestDay.date, 'long')} with ${stats.bestDay.total}. Tap a bar for details.`
            : 'Tap a bar for details.'}
      </Text>
    </View>
  )
}

function HabitGrid({ stats, colors, styles }: { stats: WeekStats; colors: Colors; styles: Styles }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Daily habits</Text>
      <View style={styles.gridHeader}>
        <View style={styles.gridName} />
        {stats.days.map(d => (
          <Text key={d.date} style={[styles.gridDay, d.isToday && styles.axisLabelToday]}>{weekday(d.date, 'narrow')}</Text>
        ))}
        <View style={styles.gridCount} />
      </View>
      {stats.habits.map(h => (
        <View key={h.task.id} style={styles.gridRow}>
          <Text style={styles.gridName} numberOfLines={1}>{h.task.title}</Text>
          {h.days.map((state, i) => (
            <View
              key={i}
              style={styles.gridCellWrap}
              accessibilityLabel={`${h.task.title}, ${weekday(stats.days[i].date, 'long')}: ${state === 'done' ? 'done' : state === 'missed' ? 'not done' : 'not applicable'}`}
            >
              {state === 'done' ? (
                <View style={[styles.cell, styles.cellDone]}>
                  <Icon name="check" size={11} color={colors.btnPrimaryText} strokeWidth={2.8} />
                </View>
              ) : state === 'missed' ? (
                <View style={[styles.cell, styles.cellMissed]} />
              ) : (
                <View style={styles.cellNa} />
              )}
            </View>
          ))}
          <Text style={styles.gridCount}>{h.doneCount}</Text>
        </View>
      ))}
    </View>
  )
}

function TagBars({ stats, isDark, colors, styles }: { stats: WeekStats; isDark: boolean; colors: Colors; styles: Styles }) {
  const max = Math.max(1, ...stats.tags.map(t => t.count))
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>By tag</Text>
      {stats.tags.map(({ tag, count }) => {
        // Fill with the tag's border tone: the chip background is too close to
        // the card surface (especially in dark mode) to read as a bar.
        const fill = tag === 'No tag' ? colors.textFaint : getTagColor(tag, isDark).border
        return (
          <View key={tag} style={styles.tagRow} accessibilityLabel={`${tag}: ${count}`}>
            <Text style={styles.tagName} numberOfLines={1}>{tag}</Text>
            <View style={styles.tagTrack}>
              <View style={[styles.tagFill, { width: `${(count / max) * 100}%`, backgroundColor: fill }]} />
            </View>
            <Text style={styles.tagCount}>{count}</Text>
          </View>
        )
      })}
    </View>
  )
}

function CompletedList({ stats, colors, styles }: { stats: WeekStats; colors: Colors; styles: Styles }) {
  const shown = stats.completedTasks.slice(0, COMPLETED_LIST_LIMIT)
  const more = stats.completedTasks.length - shown.length
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Done this week</Text>
      {shown.map(t => (
        <View key={t.id} style={styles.doneRow}>
          <Icon name="check" size={13} color={colors.accent} strokeWidth={2.4} />
          <Text style={styles.doneTitle} numberOfLines={1}>{t.title}</Text>
          <Text style={styles.doneDay}>
            {t.completed_at ? weekday(toLocalDate(t.completed_at), 'short') : 'Today'}
          </Text>
        </View>
      ))}
      {more > 0 && <Text style={styles.muted}>and {more} more</Text>}
    </View>
  )
}

function toLocalDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Styles = ReturnType<typeof createStyles>

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: space.xxl, paddingBottom: 48, gap: space.lg },
    contentDesktop: { maxWidth: 760, width: '100%', alignSelf: 'center' },
    back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: space.xl, alignSelf: 'flex-start' },
    backText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
    flip: { transform: [{ rotate: '180deg' }] },
    headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
    headerText: { flex: 1, minWidth: 0 },
    title: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5, fontFamily: displayFont.bold },
    range: { fontSize: 14, color: c.textMuted, marginTop: space.xs },
    nav: { flexDirection: 'row', gap: space.sm },
    navBtn: {
      width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    },
    navBtnDisabled: { opacity: 0.5 },
    tiles: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
    tile: {
      flex: 1, minWidth: 96, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: radius.lg, padding: space.md, gap: 2,
    },
    tileValue: { fontSize: 24, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
    tileLabel: { fontSize: 13, color: c.text, fontWeight: '500' },
    tileSub: { fontSize: 11, color: c.textMuted },
    card: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: radius.lg, padding: space.lg, gap: space.sm,
    },
    cardTitle: { fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
    emptyTitle: { fontSize: 15, fontWeight: '600', color: c.text },
    muted: { fontSize: 13, color: c.textMuted },
    hidden: { opacity: 0 },
    // Chart: bars anchored to a recessive baseline, 2px gaps, rounded data-ends.
    chart: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 2,
      borderBottomWidth: 1, borderBottomColor: c.borderLight, marginTop: space.xs,
    },
    barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingHorizontal: 4 },
    barValue: { fontSize: 11, fontWeight: '600', color: c.textSecondary, marginBottom: 3, fontVariant: ['tabular-nums'] },
    bar: { width: '100%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    barStub: { width: '100%', maxWidth: 28, height: 2, backgroundColor: c.borderLight },
    barStubFuture: { opacity: 0.4 },
    axis: { flexDirection: 'row', gap: 2 },
    axisLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: c.textMuted },
    axisLabelToday: { color: c.accentText, fontWeight: '700' },
    chartNote: { fontSize: 12, color: c.textSecondary, marginTop: space.xs },
    // Habit grid
    gridHeader: { flexDirection: 'row', alignItems: 'center' },
    gridRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.borderLight },
    gridName: { flex: 1, minWidth: 0, fontSize: 14, color: c.text, paddingRight: space.sm },
    gridDay: { width: 26, textAlign: 'center', fontSize: 11, color: c.textMuted },
    gridCellWrap: { width: 26, alignItems: 'center' },
    cell: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    cellDone: { backgroundColor: c.accent },
    cellMissed: { borderWidth: 1.5, borderColor: c.textFaint },
    cellNa: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.borderLight },
    gridCount: { width: 24, textAlign: 'right', fontSize: 12, fontWeight: '600', color: c.textSecondary, fontVariant: ['tabular-nums'] },
    // Tag bars
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    tagName: { width: 84, fontSize: 13, color: c.text },
    tagTrack: { flex: 1, height: 12 },
    tagFill: { height: 10, borderRadius: 4, minWidth: 6 },
    tagCount: { width: 24, textAlign: 'right', fontSize: 12, fontWeight: '600', color: c.textSecondary, fontVariant: ['tabular-nums'] },
    // Completed list
    doneRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
    doneTitle: { flex: 1, minWidth: 0, fontSize: 14, color: c.text },
    doneDay: { fontSize: 12, color: c.textMuted },
  })
}
