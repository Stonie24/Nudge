import {
  Karla_200ExtraLight,
  Karla_300Light,
  Karla_400Regular,
  Karla_500Medium,
  Karla_600SemiBold,
  Karla_700Bold,
  Karla_800ExtraBold,
} from '@expo-google-fonts/karla'
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader'

// Passed straight to expo-font's useFonts().
export const fontsToLoad = {
  Karla_200ExtraLight,
  Karla_300Light,
  Karla_400Regular,
  Karla_500Medium,
  Karla_600SemiBold,
  Karla_700Bold,
  Karla_800ExtraBold,
  Newsreader_400Regular,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
}

// Display face (greetings, screen titles, the wordmark) — fallback: Georgia
// has near-identical metrics, used only while the font is still loading.
export const displayFont = {
  regular: 'Newsreader_400Regular',
  semibold: 'Newsreader_600SemiBold',
  bold: 'Newsreader_700Bold',
} as const
