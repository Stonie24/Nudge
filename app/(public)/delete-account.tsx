import React, { useMemo } from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AppText as Text } from '../../components/AppText'
import { LegalPage } from '../../components/LegalPage'
import { deleteAccountMarkdown } from '../../lib/legal/content.generated'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../lib/ThemeContext'
import { setPostLoginRedirect } from '../../lib/postLoginRedirect'
import type { Colors } from '../../lib/theme'
import { space, radius } from '../../lib/theme'

/** The account deletion page Google Play links to. */
export default function DeleteAccountScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  function goToSettings() {
    if (user) {
      router.replace('/settings')
    } else {
      // After signing in, land on Settings instead of Today.
      setPostLoginRedirect('/settings')
      router.replace('/login')
    }
  }

  return (
    <LegalPage markdown={deleteAccountMarkdown}>
      <TouchableOpacity style={styles.button} onPress={goToSettings} activeOpacity={0.85} accessibilityRole="button">
        <Text style={styles.buttonText}>{user ? 'Go to Settings' : 'Sign in to delete your account'}</Text>
      </TouchableOpacity>
    </LegalPage>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    button: {
      marginTop: space.xl,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: c.btnPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.xl,
    },
    buttonText: { color: c.btnPrimaryText, fontSize: 15, fontWeight: '600' },
  })
}
