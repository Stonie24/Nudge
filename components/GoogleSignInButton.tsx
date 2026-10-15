import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'

export function GoogleSignInButton({
  loading,
  disabled,
  onPress,
}: {
  loading: boolean
  disabled?: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors)

  return (
    <>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.oauthButton, (loading || disabled) && styles.buttonDisabled]}
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={colors.text} />
          : <Text style={styles.oauthButtonText}>Continue with Google</Text>
        }
      </TouchableOpacity>
    </>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      marginTop: space.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    dividerText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    oauthButton: {
      height: 52,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inputBg,
    },
    oauthButtonText: {
      color: c.text,
      fontSize: 15,
      fontWeight: '500',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  })
}
