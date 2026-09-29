import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { Banner } from './Banner'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'

export function InlineFormError({ message }: { message?: string | null }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!message) return null

  return <Banner message={message} containerStyle={styles.banner} textStyle={styles.text} />
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    banner: {
      backgroundColor: c.dangerBg,
      borderRadius: radius.md,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
    },
    text: {
      fontSize: 13,
      fontWeight: '500',
      color: c.danger,
      lineHeight: 18,
    },
  })
}
