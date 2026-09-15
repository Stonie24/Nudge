export type Colors = {
  bg: string
  surface: string
  surfaceMuted: string
  surfaceAlt: string
  border: string
  borderLight: string
  text: string
  textSecondary: string
  textMuted: string
  textFaint: string
  placeholder: string
  accent: string
  accentBg: string
  accentText: string
  accentBorder: string
  btnPrimary: string
  btnPrimaryText: string
  btnDisabled: string
  inputBg: string
  calendarDotTask: string
  calendarDotRecurring: string
  calendarDotEvent: string
  danger: string
  dangerBg: string
  warning: string
  warningBg: string
  info: string
  infoBg: string
}

// Warm-tinted palette — replaces the old neutral-grey borders/surfaces.
// See the "Nudge Redesign" design system artboard for the source values.
export const lightColors: Colors = {
  bg: '#FAF8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F1EB',
  surfaceAlt: '#EBE6DC',
  border: '#E4DFD5',
  borderLight: '#EFEBE3',
  text: '#1A1815',
  textSecondary: '#6B6459',
  textMuted: '#9A9287',
  textFaint: '#C9C2B6',
  placeholder: '#9A9287',
  accent: '#5B8C1E',
  accentBg: '#EDF3E1',
  accentText: '#3E5518',
  accentBorder: '#ABC589',
  btnPrimary: '#1A1815',
  btnPrimaryText: '#FAF8F4',
  btnDisabled: '#E4DFD5',
  inputBg: '#FFFFFF',
  calendarDotTask: '#5B8C1E',
  calendarDotRecurring: '#8B5CF6',
  calendarDotEvent: '#F59F0A',
  danger: '#B3261E',
  dangerBg: '#FBEDEB',
  warning: '#A9660A',
  warningBg: '#FBF0DC',
  info: '#1F5FA8',
  infoBg: '#E7F0FA',
}

export const darkColors: Colors = {
  bg: '#171614',
  surface: '#201E1B',
  surfaceMuted: '#272521',
  surfaceAlt: '#131210',
  border: '#35322C',
  borderLight: '#272521',
  text: '#F5F1EA',
  textSecondary: '#A9A196',
  textMuted: '#7C756A',
  textFaint: '#4A453D',
  placeholder: '#7C756A',
  accent: '#8FBF4F',
  accentBg: '#22300F',
  accentText: '#A3CE68',
  accentBorder: '#5E7F32',
  btnPrimary: '#F5F1EA',
  btnPrimaryText: '#171614',
  btnDisabled: '#272521',
  inputBg: '#272521',
  calendarDotTask: '#8FBF4F',
  calendarDotRecurring: '#8B5CF6',
  calendarDotEvent: '#F59F0A',
  danger: '#E06858',
  dangerBg: '#3A2420',
  warning: '#D9A13F',
  warningBg: '#332A18',
  info: '#4D90D9',
  infoBg: '#1C2A38',
}

// 4pt grid — replaces today's ad-hoc padding/gap values (e.g. 13px rows, 3px gaps).
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  sheet: 28,
  pill: 999,
} as const

// Cross-platform elevation. Spread onto a style object alongside backgroundColor etc.
// iOS reads shadow*, Android reads elevation, web reads boxShadow.
export const shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
} as const
