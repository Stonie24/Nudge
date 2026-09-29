import React from 'react'
import { View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native'
import { AppText as Text } from './AppText'

// Shared skeleton for the app's theme-aware "colored box with one line of
// text" banners (inline form errors, the offline strip, etc). Callers own
// their own theme-derived colors/spacing via `containerStyle`/`textStyle` —
// this just centralizes the render + the screen-reader announcement so a
// banner appearing is always heard, not just seen.
export function Banner({
  message,
  containerStyle,
  textStyle,
}: {
  message: string
  containerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}) {
  return (
    <View style={containerStyle} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={textStyle}>{message}</Text>
    </View>
  )
}
