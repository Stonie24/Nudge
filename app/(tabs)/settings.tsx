import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useTasks } from '../../hooks/useTasks'
import { useTheme } from '../../lib/ThemeContext'
import { showAlert } from '../../lib/alert'
import { FeedbackSheet } from '../../components/FeedbackSheet'
import { useNudgeNotifications, NUDGE_TIME_LABELS, supportsNotifications } from '../../hooks/usePushNotifications'
import type { NudgeTime } from '../../hooks/usePushNotifications'
import type { Colors } from '../../lib/theme'

function SettingRow({
  label,
  value,
  onPress,
  destructive = false,
  colors,
}: {
  label: string
  value?: string
  onPress?: () => void
  destructive?: boolean
  colors: Colors
}) {
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && !destructive && <Text style={styles.rowChevron}>›</Text>}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { data: tasks } = useTasks()
  const { isDark, toggle, colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { prefs, loading: notifLoading, enable, disable, changeTime } = useNudgeNotifications()

  const totalTasks = tasks?.length ?? 0
  const completedTasks = tasks?.filter(t => t.completed).length ?? 0
  const pendingTasks = totalTasks - completedTasks

  function handleSignOut() {
    showAlert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0].toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Text style={styles.memberText}>Nudge member</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Dark mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Email" value={user?.email} colors={colors} />
            <SettingRow
              label="Change password"
              onPress={() => showAlert('Coming soon', 'This feature is on the roadmap!')}
              colors={colors}
            />
          </View>
        </View>

        {/* Notifications section — native only */}
        {supportsNotifications && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notifications</Text>
            <View style={styles.sectionCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Daily nudge reminder</Text>
                <Switch
                  value={prefs.enabled}
                  disabled={notifLoading}
                  onValueChange={async (val) => {
                    if (val) await enable(prefs.time)
                    else await disable()
                  }}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                />
              </View>
              {prefs.enabled && (
                <View style={styles.timeOptions}>
                  {(Object.keys(NUDGE_TIME_LABELS) as NudgeTime[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeChip, prefs.time === t && styles.timeChipActive]}
                      onPress={() => changeTime(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeChipText, prefs.time === t && styles.timeChipTextActive]}>
                        {NUDGE_TIME_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Version" value="0.2.0" colors={colors} />
            <SettingRow
              label="Roadmap"
              onPress={() => showAlert('Coming soon', 'Public roadmap coming soon!')}
              colors={colors}
            />
            <SettingRow
              label="Send feedback"
              onPress={() => setFeedbackOpen(true)}
              colors={colors}
            />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow label="Sign out" onPress={handleSignOut} destructive colors={colors} />
          </View>
        </View>

        <Text style={styles.footer}>Made with care · Nudge v0.2</Text>

      </ScrollView>

      <FeedbackSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </SafeAreaView>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 60,
    },
    header: {
      marginTop: 32,
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '600',
      color: c.accentText,
    },
    emailText: {
      fontSize: 15,
      fontWeight: '500',
      color: c.text,
      marginBottom: 4,
    },
    memberText: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '300',
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 28,
      overflow: 'hidden',
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16,
    },
    statDivider: {
      width: 1,
      backgroundColor: c.border,
      marginVertical: 12,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
      fontWeight: '400',
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.borderLight,
    },
    rowLabel: {
      fontSize: 15,
      color: c.text,
      flex: 1,
    },
    rowLabelDestructive: {
      color: '#E24B4A',
    },
    rowValue: {
      fontSize: 14,
      color: c.textMuted,
      marginRight: 8,
    },
    rowChevron: {
      fontSize: 18,
      color: c.textFaint,
      fontWeight: '300',
    },
    footer: {
      textAlign: 'center',
      fontSize: 12,
      color: c.textFaint,
      marginTop: 12,
    },
    timeOptions: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    timeChipActive: {
      borderColor: c.accentBorder,
      backgroundColor: c.accentBg,
    },
    timeChipText: {
      fontSize: 13,
      color: c.textMuted,
    },
    timeChipTextActive: {
      color: c.accentText,
      fontWeight: '500',
    },
  })
}
