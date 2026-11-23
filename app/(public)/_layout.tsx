import { Stack } from 'expo-router'

// Public pages: anyone can open them, signed in or not (see AuthGate in app/_layout.tsx).
export default function PublicLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
