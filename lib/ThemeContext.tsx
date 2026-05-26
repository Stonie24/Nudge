import React, { createContext, useContext, useState } from 'react'
import { useColorScheme } from 'react-native'
import { lightColors, darkColors, type Colors } from './theme'

type ThemeContextValue = {
  isDark: boolean
  colors: Colors
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [override, setOverride] = useState<'light' | 'dark' | null>(null)

  const scheme = override ?? systemScheme ?? 'light'
  const isDark = scheme === 'dark'
  const colors = isDark ? darkColors : lightColors

  function toggle() {
    setOverride(prev => {
      if (prev === null) return systemScheme === 'dark' ? 'light' : 'dark'
      return prev === 'dark' ? 'light' : 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
