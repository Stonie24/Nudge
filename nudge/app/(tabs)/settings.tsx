import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useTasks } from '../../hooks/useTasks'

function SettingRow({
  label,
  value,
  onPress,
  destructive = false,
}: {
  label: string
  value?: string
  onPress?: () => void
  destructive?: boolean
}) {
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

  const totalTasks = tasks?.length ?? 0
  const completedTasks = tasks?.filter(t => t.completed).length ?? 0
  const pendingTasks = totalTasks - completedTasks

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
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

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Email" value={user?.email} />
            <SettingRow label="Change password" onPress={() => Alert.alert('Coming soon', 'This feature is on the roadmap!')} />
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Version" value="0.1.0" />
            <SettingRow label="Roadmap" onPress={() => Alert.alert('Coming soon', 'Public roadmap coming soon!')} />
            <SettingRow label="Send feedback" onPress={() => Alert.alert('Coming soon', 'Feedback form coming soon!')} />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow label="Sign out" onPress={handleSignOut} destructive />
          </View>
        </View>

        <Text style={styles.footer}>Made with care · Nudge v0.2</Text>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF8F4',
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
    color: '#1C1917',
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
    backgroundColor: '#EAF3DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B6D11',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1917',
    marginBottom: 4,
  },
  memberText: {
    fontSize: 13,
    color: '#A8A29E',
    fontWeight: '300',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
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
    backgroundColor: '#E7E5E4',
    marginVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#A8A29E',
    marginTop: 2,
    fontWeight: '400',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8A29E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3EF',
  },
  rowLabel: {
    fontSize: 15,
    color: '#1C1917',
    flex: 1,
  },
  rowLabelDestructive: {
    color: '#E24B4A',
  },
  rowValue: {
    fontSize: 14,
    color: '#A8A29E',
    marginRight: 8,
  },
  rowChevron: {
    fontSize: 18,
    color: '#D6D3D1',
    fontWeight: '300',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D6D3D1',
    marginTop: 12,
  },
})