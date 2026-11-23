import React, { useEffect, useMemo, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AppText as Text } from './AppText'
import { Icon } from './Icon'
import { MarkdownView } from './MarkdownView'
import { useTheme } from '../lib/ThemeContext'
import type { Colors } from '../lib/theme'
import { space } from '../lib/theme'
import { displayFont } from '../lib/fonts'

/**
 * A public page (privacy policy, account deletion): no sign-in needed, so
 * the stores and Google can link to it. Opened from the app (with
 * ?back=/settings etc.) it shows a Back button; opened from a link it shows
 * the Nudge wordmark instead.
 *
 * The app's root is a Slot, not a stack, so router.back() would land on the
 * first screen of the previous section; `back` says exactly where to return.
 */
export function legalHref(page: '/privacy' | '/delete-account', back: string) {
  return `${page}?back=${encodeURIComponent(back)}` as const
}

// Only in-app paths: never another site.
const safeBack = (v: unknown) => (typeof v === 'string' && /^\/(?!\/)/.test(v) ? v : null)

export function LegalPage({
  markdown,
  children,
}: {
  markdown: string
  /** Extra content after the text, e.g. a button. */
  children?: React.ReactNode
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const router = useRouter()
  const back = safeBack(useLocalSearchParams<{ back?: string }>().back)

  // Jump to /privacy#section once that heading has been laid out.
  const scrollRef = useRef<ScrollView>(null)
  const bodyY = useRef(0)
  const target = useRef(Platform.OS === 'web' && typeof window !== 'undefined' ? decodeURIComponent(window.location.hash.slice(1)) : '')
  function onHeadingLayout(id: string, y: number) {
    if (!target.current || id !== target.current) return
    target.current = ''
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, bodyY.current + y - space.lg), animated: false }))
  }

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]
      if (h1) document.title = h1
    }
  }, [markdown])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.topBar}>
            {back ? (
              <TouchableOpacity
                style={styles.back}
                onPress={() => router.replace(back as never)}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="chevron" size={16} color={colors.textMuted} strokeWidth={2} rotate={180} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.brand}
                onPress={() => router.replace('/')}
                accessibilityRole="link"
                accessibilityLabel="Open Nudge"
              >
                <View style={styles.dot} />
                <Text style={styles.wordmark}>nudge</Text>
              </TouchableOpacity>
            )}
          </View>

          <View onLayout={e => { bodyY.current = e.nativeEvent.layout.y }}>
            <MarkdownView source={markdown} onHeadingLayout={onHeadingLayout} />
          </View>

          {children}

          <View style={styles.footer}>
            <Text style={styles.footerLink} onPress={() => router.replace('/privacy')} accessibilityRole="link">
              Privacy policy
            </Text>
            <Text style={styles.footerSep}>·</Text>
            <Text style={styles.footerLink} onPress={() => router.replace('/delete-account')} accessibilityRole="link">
              Delete your account
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingHorizontal: space.xl, paddingBottom: space.huge },
    // A comfortable reading width on desktop.
    column: { width: '100%', maxWidth: 680, alignSelf: 'center' },
    topBar: { paddingTop: space.xl, paddingBottom: space.xxl, flexDirection: 'row' },
    back: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    backText: { fontSize: 15, color: c.textMuted, fontWeight: '500' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent },
    wordmark: { fontFamily: displayFont.bold, fontSize: 24, color: c.text, letterSpacing: -0.5 },
    footer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
      marginTop: space.huge,
      paddingTop: space.xl,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerLink: { fontSize: 14, color: c.textSecondary, textDecorationLine: 'underline' },
    footerSep: { fontSize: 14, color: c.textFaint },
  })
}
