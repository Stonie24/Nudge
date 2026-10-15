import { View, Image, StyleSheet } from 'react-native'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'

export function Avatar({
  uri,
  label,
  size = 64,
}: {
  uri?: string | null
  label: string
  size?: number
}) {
  const { colors } = useTheme()
  const dimensions = { width: size, height: size, borderRadius: size / 2 }

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimensions]} />
  }

  return (
    <View style={[styles.placeholder, dimensions, { backgroundColor: colors.accentBg }]}>
      <Text style={[styles.initial, { color: colors.accentText, fontSize: size * 0.375 }]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '600',
  },
})
