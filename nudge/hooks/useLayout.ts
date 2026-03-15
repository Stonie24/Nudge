import { useWindowDimensions } from 'react-native'

export function useLayout() {
  const { width } = useWindowDimensions()
  return {
    isDesktop: width >= 768,
    width,
  }
}