import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/ThemeContext'
import type { Colors } from '../../lib/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
      paddingHorizontal: 28,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.accent,
      marginBottom: 12,
    },
    logo: {
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      fontSize: 36,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -1,
      marginBottom: 6,
    },
    tagline: {
      fontSize: 15,
      color: c.textSecondary,
      fontWeight: '300',
    },
    form: {
      gap: 16,
    },
    field: {
      gap: 6,
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
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.inputBg,
    },
    button: {
      height: 52,
      backgroundColor: c.btnPrimary,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
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
      marginTop: 32,
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
  })
}
