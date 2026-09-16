import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native'

// Karla is the app's interface font — everything except the display faces
// (greetings, screen titles) that opt into Newsreader explicitly via their
// own fontFamily. Custom fonts don't synthesize bold like system fonts do,
// so the weight declared in a Text's style has to map to the matching
// pre-built font file rather than relying on fontWeight alone.
const WEIGHT_TO_FAMILY: Record<string, string> = {
  '200': 'Karla_200ExtraLight',
  '300': 'Karla_300Light',
  '400': 'Karla_400Regular',
  normal: 'Karla_400Regular',
  '500': 'Karla_500Medium',
  '600': 'Karla_600SemiBold',
  '700': 'Karla_700Bold',
  bold: 'Karla_700Bold',
  '800': 'Karla_800ExtraBold',
}

export function AppText({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined
  const weight = flat?.fontWeight ? String(flat.fontWeight) : '400'
  const family = WEIGHT_TO_FAMILY[weight] ?? 'Karla_400Regular'
  return <RNText {...rest} style={[{ fontFamily: family }, style]} />
}
