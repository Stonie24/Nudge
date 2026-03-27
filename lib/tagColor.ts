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

export function getTagColor(tag: string): TagColor {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  // deterministic fallback based on tag string
  const index = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[index]
}