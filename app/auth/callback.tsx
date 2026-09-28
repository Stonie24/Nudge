import { useEffect } from 'react'
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { createSessionFromUrl } from '../../lib/oauth'
import { useTheme } from '../../lib/ThemeContext'

// Landing spot for the OAuth redirect on web, where the browser navigates
// the page itself rather than resolving WebBrowser.openAuthSessionAsync's
// promise. On native this route is normally never reached — the in-app
// browser intercepts the redirect before it gets here.
export default function AuthCallback() {
  const router = useRouter()
  const { colors } = useTheme()

  useEffect(() => {
    async function run() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          await createSessionFromUrl(window.location.href)
        }
        router.replace('/')
      } catch (err) {
        console.error('OAuth callback error:', err)
        router.replace('/(auth)/login')
      }
    }
    run()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.text} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
