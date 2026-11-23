import React, { useMemo } from 'react'
import { View, StyleSheet, Linking, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { AppText as Text } from './AppText'
import { useTheme } from '../lib/ThemeContext'
import { parseMarkdown, type Block, type Inline } from '../lib/markdown'
import type { Colors } from '../lib/theme'
import { space, radius } from '../lib/theme'
import { displayFont } from '../lib/fonts'

/**
 * Renders the app's legal pages (see lib/markdown.ts for what's supported).
 * Reports each heading's position so the page can jump to a section
 * (e.g. /privacy#delete-your-account).
 */
export function MarkdownView({
  source,
  onHeadingLayout,
}: {
  source: string
  onHeadingLayout?: (id: string, y: number) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const blocks = useMemo(() => parseMarkdown(source), [source])
  const router = useRouter()

  function open(href: string) {
    if (href.startsWith('/')) router.push(href as never)
    else Linking.openURL(href).catch(() => {})
  }

  function renderInline(nodes: Inline[], keyPrefix: string) {
    return nodes.map((n, i) => {
      const key = `${keyPrefix}-${i}`
      if (n.type === 'code') return <Text key={key} style={styles.code}>{n.text}</Text>
      if (n.type === 'link') {
        return (
          <Text
            key={key}
            style={[styles.link, n.bold && styles.bold]}
            onPress={() => open(n.href)}
            accessibilityRole="link"
            // On web, a real href lets people copy the link or open it in a new tab.
            {...(Platform.OS === 'web' ? ({ href: n.href } as object) : {})}
          >
            {n.text}
          </Text>
        )
      }
      // Plain text stays a bare string so it inherits the parent's font
      // (a nested AppText would reset headings to the body font).
      return n.bold ? <Text key={key} style={styles.bold}>{n.text}</Text> : n.text
    })
  }

  function renderBlock(b: Block, i: number) {
    switch (b.type) {
      case 'heading':
        return (
          <Text
            key={i}
            nativeID={b.id}
            accessibilityRole="header"
            style={b.level === 1 ? styles.h1 : b.level === 2 ? styles.h2 : styles.h3}
            onLayout={e => onHeadingLayout?.(b.id, e.nativeEvent.layout.y)}
          >
            {renderInline(b.content, `h${i}`)}
          </Text>
        )
      case 'paragraph':
        return <Text key={i} style={styles.p}>{renderInline(b.content, `p${i}`)}</Text>
      case 'list':
        return (
          <View key={i} style={styles.list}>
            {b.items.map((item, j) => (
              <View key={j} style={styles.li}>
                <Text style={b.ordered ? styles.number : styles.bullet}>{b.ordered ? `${j + 1}.` : '•'}</Text>
                <Text style={styles.liText}>{renderInline(item, `l${i}-${j}`)}</Text>
              </View>
            ))}
          </View>
        )
      case 'table':
        // Stacked cards read better than a wide table on a phone.
        return (
          <View key={i} style={styles.table}>
            {b.rows.map((row, r) => (
              <View key={r} style={styles.card}>
                {row.map((cell, c) => (
                  <View key={c} style={c > 0 && styles.cardField}>
                    {c > 0 && <Text style={styles.cardLabel}>{b.header[c]?.map(n => n.text).join('')}</Text>}
                    <Text style={c === 0 ? styles.cardTitle : styles.cardValue}>
                      {renderInline(cell, `t${i}-${r}-${c}`)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )
    }
  }

  return <View>{blocks.map(renderBlock)}</View>
}

function createStyles(c: Colors) {
  const body = { fontSize: 16, lineHeight: 25, color: c.text }
  return StyleSheet.create({
    h1: {
      fontFamily: displayFont.bold,
      fontSize: 34,
      lineHeight: 40,
      color: c.text,
      letterSpacing: -0.8,
      marginBottom: space.xl,
    },
    h2: {
      fontFamily: displayFont.semibold,
      fontSize: 24,
      lineHeight: 30,
      color: c.text,
      marginTop: space.xxxl,
      marginBottom: space.md,
    },
    h3: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
      marginTop: space.xl,
      marginBottom: space.sm,
    },
    p: { ...body, marginBottom: space.md },
    bold: { fontWeight: '700' },
    link: { color: c.accentText, textDecorationLine: 'underline' },
    code: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 14 },
    list: { marginBottom: space.md, gap: space.sm },
    li: { flexDirection: 'row', gap: space.sm, paddingRight: space.sm },
    bullet: { ...body, color: c.accent, width: 14 },
    number: { ...body, color: c.textSecondary, fontWeight: '600', width: 22 },
    liText: { ...body, flex: 1 },
    table: { gap: space.md, marginBottom: space.md },
    card: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: space.lg,
      gap: space.sm,
    },
    cardTitle: { ...body, fontWeight: '700' },
    cardField: { gap: 2 },
    cardLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    cardValue: { fontSize: 15, lineHeight: 22, color: c.textSecondary },
  })
}
