import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space, radius, shadow } from '../lib/theme'

// Matches the tab bar height in app/(tabs)/_layout.tsx so the toast floats
// just above it rather than covering it.
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 60

export function UndoToast({
  visible,
  message,
  onUndo,
}: {
  visible: boolean
  message: string
  onUndo: () => void
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])
  const progress = useRef(new Animated.Value(0)).current
  const [mounted, setMounted] = useState(visible)
  // Keep showing the last message while the toast animates out.
  const lastMessage = useRef(message)
  if (message) lastMessage.current = message

  useEffect(() => {
    if (visible) setMounted(true)
    Animated.spring(progress, {
      toValue: visible ? 1 : 0,
      tension: 140,
      friction: 16,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false)
    })
  }, [visible, message]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  const bottom = Platform.OS === 'web'
    ? TAB_BAR_HEIGHT + space.md
    : Math.max(TAB_BAR_HEIGHT, insets.bottom) + space.md

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Text style={styles.message} numberOfLines={1}>{lastMessage.current}</Text>
        <TouchableOpacity
          onPress={onUndo}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Undo delete"
        >
          <Text style={styles.undo}>Undo</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: space.lg,
      right: space.lg,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.lg,
      width: '100%',
      maxWidth: 480,
      backgroundColor: c.btnPrimary,
      borderRadius: radius.md,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
      ...shadow.lg,
    },
    message: { flex: 1, fontSize: 14, color: c.btnPrimaryText },
    undo: { fontSize: 14, fontWeight: '600', color: c.accentBorder },
  })
}
