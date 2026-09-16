import { useState, useMemo } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { AppText as Text } from '../../components/AppText'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/ThemeContext'
import type { Colors } from '../../lib/theme'
import { space, radius } from '../../lib/theme'
import { displayFont } from '../../lib/fonts'

// Dev-only quick sign-in — never available in a production build. Reads from
// .env (gitignored) rather than hardcoding a credential in source.
const DEV_LOGIN_EMAIL = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL
const DEV_LOGIN_PASSWORD = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD
const DEV_LOGIN_ENABLED = __DEV__ && !!DEV_LOGIN_EMAIL && !!DEV_LOGIN_PASSWORD

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [devLoading, setDevLoading] = useState(false)

  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) Alert.alert('Login failed', error.message)
    // on success, _layout.tsx AuthGate redirects to /(tabs)/
  }

  async function handleDevLogin() {
    if (!DEV_LOGIN_EMAIL || !DEV_LOGIN_PASSWORD) return
    setDevLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: DEV_LOGIN_EMAIL,
      password: DEV_LOGIN_PASSWORD,
    })
    setDevLoading(false)
    if (error) Alert.alert('Dev login failed', error.message)
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text style={styles.logo}>nudge</Text>
          <Text style={styles.tagline}>Welcome back</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.btnPrimaryText} />
              : <Text style={styles.buttonText}>Log in</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup">
            <Text style={styles.footerLink}>Sign up</Text>
          </Link>
        </View>

        {DEV_LOGIN_ENABLED && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={handleDevLogin}
            disabled={devLoading}
            activeOpacity={0.7}
          >
            {devLoading
              ? <ActivityIndicator color={colors.textSecondary} size="small" />
              : <Text style={styles.devBtnText}>Dev: sign in as test user</Text>
            }
          </TouchableOpacity>
        )}

      </View>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: space.xxl,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: space.huge,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.accent,
      marginBottom: space.md,
    },
    logo: {
      fontFamily: displayFont.bold,
      fontSize: 36,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -1,
      marginBottom: space.sm,
    },
    tagline: {
      fontSize: 15,
      color: c.textSecondary,
      fontWeight: '300',
    },
    form: {
      gap: space.lg,
    },
    field: {
      gap: space.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
      marginLeft: 2,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: space.lg,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.inputBg,
    },
    button: {
      height: 52,
      backgroundColor: c.btnPrimary,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: space.sm,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: c.btnPrimaryText,
      fontSize: 15,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: space.xxxl,
    },
    footerText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: c.accentText,
      fontWeight: '500',
    },
    devBtn: {
      marginTop: space.xl,
      paddingVertical: space.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.warning,
      borderRadius: radius.sm,
    },
    devBtnText: {
      fontSize: 12,
      color: c.warning,
      fontWeight: '500',
    },
  })
}
