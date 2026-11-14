import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native'
import { Icon } from './Icon'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'
import { triggerHaptic } from '../hooks/useAnimation'
import type { Colors } from '../lib/theme'
import { space } from '../lib/theme'

// Drag at least this far (or flick fast enough) to trigger the action on release.
const DELETE_THRESHOLD = 96
const FLICK_VELOCITY = 0.8
// Pointer movement (px) beyond which a mouse press counts as a drag, not a tap (web).
const TAP_SLOP = 10
const useNativeDriver = Platform.OS !== 'web'

/**
 * Swipe left to delete; optionally swipe right for a second action (e.g.
 * "move to backlog"). Built on PanResponder + Animated (rather than
 * gesture-handler's Swipeable) so it works the same on iOS, Android and web
 * without needing a GestureHandlerRootView. Only claims clearly-horizontal
 * drags, so vertical list scrolling is unaffected.
 */
export function SwipeableRow({
  onDelete,
  onSwipeRight,
  swipeRightLabel = 'Move to backlog',
  children,
}: {
  onDelete: () => void
  /** Enables swiping right. Omit to keep the row left-swipe only. */
  onSwipeRight?: () => void
  swipeRightLabel?: string
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
  const onSwipeRightRef = useRef(onSwipeRight)
  onSwipeRightRef.current = onSwipeRight
  // On web the browser still fires a 'click' after a drag ends, which
  // react-native-web treats as a press on whatever is under the pointer
  // (e.g. opening the task). Swallow that one click after any drag.
  const suppressClick = useRef(false)
  const containerRef = useRef<View>(null)

  // react-native-web fires onPress from the native 'click' event, which the
  // browser dispatches after any mousedown/up on the same element, even a
  // drag. Block it in the capture phase when the pointer moved like a drag
  // (or a swipe just ran), matching native where a moving touch isn't a tap.
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const node = containerRef.current as unknown as HTMLElement | null
    if (!node?.addEventListener) return
    // Track the furthest the pointer got from where it went down, so a drag
    // that returns to its start before release still isn't a tap.
    let downX = 0, downY = 0, maxDist = 0, down = false
    const onPointerDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; maxDist = 0; down = true }
    const onPointerMove = (e: PointerEvent) => {
      if (down) maxDist = Math.max(maxDist, Math.hypot(e.clientX - downX, e.clientY - downY))
    }
    const onPointerUp = () => { down = false }
    const onClick = (e: MouseEvent) => {
      const moved = maxDist > TAP_SLOP
      maxDist = 0
      if (!suppressClick.current && !moved) return
      suppressClick.current = false
      e.stopPropagation()
      e.preventDefault()
    }
    node.addEventListener('pointerdown', onPointerDown, true)
    // move/up on window: the pointer often leaves the row mid-drag
    window.addEventListener('pointermove', onPointerMove, true)
    window.addEventListener('pointerup', onPointerUp, true)
    node.addEventListener('click', onClick, true)
    return () => {
      node.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onPointerMove, true)
      window.removeEventListener('pointerup', onPointerUp, true)
      node.removeEventListener('click', onClick, true)
    }
  }, [])

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      (g.dx < -10 || (g.dx > 10 && !!onSwipeRightRef.current)) &&
      Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      armed.current = false
      suppressClick.current = true
    },
    onPanResponderMove: (_, g) => {
      const canRight = !!onSwipeRightRef.current
      translateX.setValue(canRight ? g.dx : Math.min(0, g.dx))
      const nowArmed = Math.abs(g.dx) >= DELETE_THRESHOLD && (g.dx < 0 || canRight)
      if (nowArmed !== armed.current) {
        armed.current = nowArmed
        if (nowArmed) triggerHaptic('light')
      }
    },
    onPanResponderRelease: (_, g) => {
      // The click (if any) is dispatched right after this mouseup.
      setTimeout(() => { suppressClick.current = false }, 50)
      const left = g.dx <= -DELETE_THRESHOLD || (g.vx < -FLICK_VELOCITY && g.dx < -space.xxxl)
      const right = !!onSwipeRightRef.current &&
        (g.dx >= DELETE_THRESHOLD || (g.vx > FLICK_VELOCITY && g.dx > space.xxxl))
      if (left || right) {
        Animated.timing(translateX, {
          toValue: (left ? -1 : 1) * (width.current || 500),
          duration: 180,
          useNativeDriver,
        }).start(({ finished }) => {
          triggerHaptic('medium')
          // The user released past the threshold, so the action stands even
          // if a new touch interrupted the slide-out.
          if (left) onDeleteRef.current()
          else onSwipeRightRef.current?.()
          // The row normally unmounts once the task leaves the cache; reset
          // in case it's reused (e.g. after undo restores the same task),
          // unless a new drag already took over the position.
          if (finished) translateX.setValue(0)
        })
      } else {
        reset()
      }
    },
    onPanResponderTerminate: () => {
      setTimeout(() => { suppressClick.current = false }, 50)
      reset()
    },
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    Animated.spring(translateX, {
      toValue: 0,
      tension: 160,
      friction: 18,
      useNativeDriver,
    }).start()
  }

  // Built once per row: re-creating these on every render (e.g. when a row
  // re-renders while its spring-back runs on the native driver) can leave
  // the backgrounds bound to a detached animation node on iOS/Android.
  const { iconOpacity, rightIconOpacity, deleteBgOpacity, rightBgOpacity } = useMemo(() => ({
    iconOpacity: translateX.interpolate({
      inputRange: [-DELETE_THRESHOLD, -space.xxxl, 0],
      outputRange: [1, 0.4, 0],
      extrapolate: 'clamp',
    }),
    rightIconOpacity: translateX.interpolate({
      inputRange: [0, space.xxxl, DELETE_THRESHOLD],
      outputRange: [0, 0.4, 1],
      extrapolate: 'clamp',
    }),
    // Only one background shows at a time, depending on drag direction.
    deleteBgOpacity: translateX.interpolate({ inputRange: [-1, 0], outputRange: [1, 0], extrapolate: 'clamp' }),
    rightBgOpacity: translateX.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
  }), [translateX])

  const actions = [
    { name: 'delete', label: 'Delete task' },
    ...(onSwipeRight ? [{ name: 'swipeRight', label: swipeRightLabel }] : []),
  ]

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={e => { width.current = e.nativeEvent.layout.width }}
      accessibilityActions={actions}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'delete') onDelete()
        if (e.nativeEvent.actionName === 'swipeRight') onSwipeRight?.()
      }}
    >
      {/*
        The action backgrounds are always mounted (invisible at rest, faded in
        by the drag) rather than added when a swipe starts. Mounting them
        mid-gesture broke after a cancelled swipe: an interrupted spring-back
        hid them again during the next swipe, and on native, views mounted
        after a native-driver animation could stay stuck at opacity 0.
      */}
      <Animated.View
        testID="swipe-delete-action"
        style={[styles.action, { opacity: deleteBgOpacity }]}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View style={{ opacity: iconOpacity }}>
          <Icon name="trash" size={20} color={colors.danger} />
        </Animated.View>
      </Animated.View>
      {onSwipeRight && (
        <Animated.View
          testID="swipe-right-action"
          style={[styles.rightAction, { opacity: rightBgOpacity }]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.View style={[styles.rightActionContent, { opacity: rightIconOpacity }]}>
            <Icon name="list" size={18} color={colors.accentText} strokeWidth={2} />
            <Text style={styles.rightActionText}>Backlog</Text>
          </Animated.View>
        </Animated.View>
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
    rightAction: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.accentBg,
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingLeft: space.xl,
    },
    rightActionContent: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    rightActionText: { fontSize: 13, fontWeight: '600', color: c.accentText },
    foreground: { backgroundColor: c.bg },
  })
}
