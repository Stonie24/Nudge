import React, { useMemo, useRef, useState } from 'react'
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '../lib/ThemeContext'
import { triggerHaptic } from '../hooks/useAnimation'
import type { Colors } from '../lib/theme'
import { space } from '../lib/theme'

// Drag at least this far left (or flick fast enough) to delete on release.
const DELETE_THRESHOLD = 96
const FLICK_VELOCITY = 0.8
const useNativeDriver = Platform.OS !== 'web'

/**
 * Swipe left to delete. Built on PanResponder + Animated (rather than
 * gesture-handler's Swipeable) so it works the same on iOS, Android and web
 * without needing a GestureHandlerRootView. Only claims clearly-horizontal
 * drags, so vertical list scrolling is unaffected.
 */
export function SwipeableRow({
  onDelete,
  children,
}: {
  onDelete: () => void
  children: React.ReactNode
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const translateX = useRef(new Animated.Value(0)).current
  const width = useRef(0)
  const armed = useRef(false)
  // Keep the latest callback without rebuilding the responder each render.
  const onDeleteRef = useRef(onDelete)
  onDeleteRef.current = onDelete
  const [swiping, setSwiping] = useState(false)

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      armed.current = false
      setSwiping(true)
    },
    onPanResponderMove: (_, g) => {
      translateX.setValue(Math.min(0, g.dx))
      const nowArmed = g.dx <= -DELETE_THRESHOLD
      if (nowArmed !== armed.current) {
        armed.current = nowArmed
        if (nowArmed) triggerHaptic('light')
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx <= -DELETE_THRESHOLD || (g.vx < -FLICK_VELOCITY && g.dx < -space.xxxl)) {
        Animated.timing(translateX, {
          toValue: -(width.current || 500),
          duration: 180,
          useNativeDriver,
        }).start(() => {
          triggerHaptic('medium')
          onDeleteRef.current()
          // The row normally unmounts once the task leaves the cache; reset
          // in case it's reused (e.g. after undo restores the same task).
          translateX.setValue(0)
          setSwiping(false)
        })
      } else {
        reset()
      }
    },
    onPanResponderTerminate: () => reset(),
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    Animated.spring(translateX, {
      toValue: 0,
      tension: 160,
      friction: 18,
      useNativeDriver,
    }).start(() => setSwiping(false))
  }

  const iconOpacity = translateX.interpolate({
    inputRange: [-DELETE_THRESHOLD, -space.xxxl, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  })

  return (
    <View
      style={styles.container}
      onLayout={e => { width.current = e.nativeEvent.layout.width }}
      accessibilityActions={[{ name: 'delete', label: 'Delete task' }]}
      onAccessibilityAction={e => { if (e.nativeEvent.actionName === 'delete') onDelete() }}
    >
      {swiping && (
        <View style={styles.action}>
          <Animated.View style={{ opacity: iconOpacity }}>
            <Icon name="trash" size={20} color={colors.danger} />
          </Animated.View>
        </View>
      )}
      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...responder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    container: { overflow: 'hidden' },
    action: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.dangerBg,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingRight: space.xl,
    },
    foreground: { backgroundColor: c.bg },
  })
}
