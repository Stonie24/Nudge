export type TagColor = {
  bg: string
  text: string
  border: string
}

const TAG_COLORS: Record<string, TagColor> = {
  Work:     { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
  Personal: { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  Focus:    { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6' },
  Health:   { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
  Errands:  { bg: '#FAECE7', text: '#993C1D', border: '#F5C4B3' },
}

const FALLBACK_COLORS: TagColor[] = [
  { bg: '#FBEAF0', text: '#993556', border: '#F4C0D1' },
  { bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
  { bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7' },
]

// Dark-mode set. The light chip colors were previously reused as-is on dark
// surfaces, which glares — these are tinted for a dark background instead.
const TAG_COLORS_DARK: Record<string, TagColor> = {
  Work:     { bg: '#1B2C3D', text: '#7EAEDA', border: '#2E4A63' },
  Personal: { bg: '#332812', text: '#E0A855', border: '#4F3D1B' },
  Focus:    { bg: '#241F3D', text: '#A79AE8', border: '#382F5C' },
  Health:   { bg: '#22300F', text: '#A3CE68', border: '#3A5218' },
  Errands:  { bg: '#33200F', text: '#E08A5F', border: '#4F311B' },
}

const FALLBACK_COLORS_DARK: TagColor[] = [
  { bg: '#331A24', text: '#E08CA8', border: '#4F2A38' },
  { bg: '#0F2E27', text: '#5FCDA9', border: '#1B4A3E' },
  { bg: '#272521', text: '#B3AB9E', border: '#3D3A33' },
]

export function getTagColor(tag: string, isDark: boolean = false): TagColor {
  const presets = isDark ? TAG_COLORS_DARK : TAG_COLORS
  if (presets[tag]) return presets[tag]
  // deterministic fallback based on tag string
  const fallbacks = isDark ? FALLBACK_COLORS_DARK : FALLBACK_COLORS
  const index = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % fallbacks.length
  return fallbacks[index]
}
