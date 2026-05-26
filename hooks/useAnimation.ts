import { useRef, useEffect } from 'react'
import { Animated, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

/**
 * Fade + slide-up entrance when a component mounts.
 * `delay` is intentionally captured once at mount time via a ref —
 * the animation only runs once per mount and the delay should not change.
 */
export function useEntranceAnimation(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(10)).current
  // Capture the mount-time delay so the effect dependency array can be empty
  // without a stale closure warning — delay is a "mount-only" parameter.
  const mountDelay = useRef(delay).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: mountDelay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: mountDelay,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

/**
 * Fire haptic feedback — silently skipped on web.
 * expo-haptics is a listed dependency so Metro can resolve it at build time.
 */
export async function triggerHaptic(style: 'light' | 'medium' = 'light') {
  if (Platform.OS === 'web') return
  try {
    await Haptics.impactAsync(
      style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    )
  } catch {
    // Silently ignore if haptics are unavailable on the device
  }
}
