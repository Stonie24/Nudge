import React, { useEffect, useRef, useState } from 'react'
import { View, Animated, Easing, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'

/**
 * Circular completion meter for the Today screen. The arc eases to the new
 * value whenever `completed`/`total` change, so ticking a task visibly fills
 * the ring. An empty board renders the bare track.
 */
export function ProgressRing({
  completed,
  total,
  size = 64,
  strokeWidth = 6,
}: {
  completed: number
  total: number
  size?: number
  strokeWidth?: number
}) {
  const { colors } = useTheme()
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const fraction = total > 0 ? Math.min(completed / total, 1) : 0

  // Animated drives a plain number in state rather than animating SVG props
  // directly: Animated.createAnimatedComponent(Circle) leaks `collapsable` onto
  // the DOM <circle> on web. The tween is 450ms, so the extra renders are cheap.
  const progress = useRef(new Animated.Value(fraction)).current
  const [shown, setShown] = useState(fraction)

  useEffect(() => {
    const id = progress.addListener(({ value }) => setShown(value))
    return () => progress.removeListener(id)
  }, [progress])

  useEffect(() => {
    Animated.timing(progress, {
      toValue: fraction,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [fraction, progress])

  const dashOffset = circumference * (1 - shown)
  // A round line cap draws a dot even at zero length — hide the arc at 0%.
  const arcOpacity = shown < 0.001 ? 0 : 1

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={`${completed} of ${total} tasks done today`}
      accessibilityValue={{ min: 0, max: total, now: completed }}
    >
      {/* Rotate -90° so the arc starts at 12 o'clock instead of 3 o'clock. */}
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accentBorder}
          strokeOpacity={0.35}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeOpacity={arcOpacity}
          fill="none"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.count, { color: colors.accentText }]}>
          {completed}/{total}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
})
