import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'


export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignup() {
    if (!email || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Your passwords don\'t match.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert('Signup failed', error.message)
    } else {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Once confirmed, you can log in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      )
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text style={styles.logo}>nudge</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#A8A29E"
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
              placeholder="At least 6 characters"
              placeholderTextColor="#A8A29E"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A8A29E"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FAF8F4" />
              : <Text style={styles.buttonText}>Create account</Text>
            }
          </TouchableOpacity>

          <Text style={styles.hint}>
            By signing up you agree to our terms of service and privacy policy.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login">
            <Text style={styles.footerLink}>Log in</Text>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#639922',
    marginBottom: 12,
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: '#78716C',
    fontWeight: '300',
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#57534E',
    marginLeft: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1917',
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 52,
    backgroundColor: '#1C1917',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FAF8F4',
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    fontSize: 11,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#78716C',
  },
  footerLink: {
    fontSize: 14,
    color: '#3B6D11',
    fontWeight: '500',
  },
})
