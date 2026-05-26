import { useRef, useEffect } from 'react'
import { Animated, Platform } from 'react-native'

/** Fade + slide-up entrance when a component mounts. */
export function useEntranceAnimation(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(10)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return { opacity, translateY }
}

/**
 * Checkbox animation with two modes:
 *  - triggerComplete: big bounce + expanding ripple ring (rewarding)
 *  - triggerUncomplete: small nudge (neutral)
 */
export function useCheckboxAnimation() {
  const scale = useRef(new Animated.Value(1)).current
  const ringScale = useRef(new Animated.Value(0)).current
  const ringOpacity = useRef(new Animated.Value(0)).current

  function triggerComplete() {
    ringScale.setValue(0)
    ringOpacity.setValue(0.7)
    Animated.parallel([
      // Bigger, snappier bounce
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.45,
          tension: 220,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 180,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Ripple ring expands and fades
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 2.6,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }

  function triggerUncomplete() {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.15,
        tension: 250,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return { scale, ringScale, ringOpacity, triggerComplete, triggerUncomplete }
}

/** Scale-down on press for primary buttons. */
export function usePressAnimation() {
  const scale = useRef(new Animated.Value(1)).current

  function onPressIn() {
    Animated.spring(scale, {
      toValue: 0.96,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }

  function onPressOut() {
    Animated.spring(scale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }

  return { scale, onPressIn, onPressOut }
}

/** Fire haptic feedback — silently skipped on web. */
export async function triggerHaptic(style: 'light' | 'medium' = 'light') {
  if (Platform.OS === 'web') return
  try {
    const Haptics = await import('expo-haptics')
    const feedbackStyle =
      style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    await Haptics.impactAsync(feedbackStyle)
  } catch {
    // expo-haptics not installed or unavailable — no-op
  }
}
