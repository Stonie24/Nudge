/**
 * A tiny markdown parser for the app's own legal pages (privacy policy,
 * account deletion). It only understands what those files use: headings,
 * paragraphs, bullet and numbered lists, tables, **bold**, [links](url), `code` and
 * <a id="..."></a> anchors. Pure, so it's easy to test.
 */

export type Inline =
  | { type: 'text'; text: string; bold?: boolean }
  | { type: 'link'; text: string; href: string; bold?: boolean }
  | { type: 'code'; text: string }

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; content: Inline[]; id: string }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'table'; header: Inline[][]; rows: Inline[][][] }

/** "Deleting your account" → "deleting-your-account" (GitHub-style). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  // Bold may wrap a link: **[text](url)**. Split on bold first, then links/code inside.
  const boldParts = src.split(/\*\*(.+?)\*\*/g)
  boldParts.forEach((part, i) => {
    const bold = i % 2 === 1
    const re = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(part))) {
      if (m.index > last) out.push(text(part.slice(last, m.index), bold))
      if (m[1] !== undefined) out.push(bold ? { type: 'link', text: m[1], href: m[2], bold } : { type: 'link', text: m[1], href: m[2] })
      else out.push({ type: 'code', text: m[3] })
      last = m.index + m[0].length
    }
    if (last < part.length) out.push(text(part.slice(last), bold))
  })
  return out.filter(n => n.text !== '')
}

function text(t: string, bold: boolean): Inline {
  return bold ? { type: 'text', text: t, bold } : { type: 'text', text: t }
}

const plain = (inl: Inline[]) => inl.map(n => n.text).join('')
const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map(c => parseInline(c.trim()))

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let list: string[] | null = null
  let ordered = false
  let pendingId: string | null = null

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'paragraph', content: parseInline(para.join(' ')) })
    para = []
  }
  const flushList = () => {
    if (list) blocks.push({ type: 'list', ordered, items: list.map(parseInline) })
    list = null
  }
  const flush = () => { flushPara(); flushList() }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // <a id="x"></a> sets the id of the next heading.
    const anchor = trimmed.match(/^<a\s+id="([^"]+)"\s*><\/a>$/)
    if (anchor) { flush(); pendingId = anchor[1]; continue }

    if (!trimmed) { flush(); continue }
    // Notes to the editor (> quotes) aren't part of the published page.
    if (trimmed.startsWith('>')) { flush(); continue }

    const h = trimmed.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flush()
      const content = parseInline(h[2])
      blocks.push({ type: 'heading', level: h[1].length as 1 | 2 | 3, content, id: pendingId ?? slugify(plain(content)) })
      pendingId = null
      continue
    }

    if (trimmed.startsWith('|') && lines[i + 1]?.trim().match(/^\|[\s|:-]+\|$/)) {
      flush()
      const header = cells(trimmed)
      const rows: Inline[][][] = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]))
      i--
      blocks.push({ type: 'table', header, rows })
      continue
    }

    const bullet = line.match(/^\s*(?:([-*])|\d+\.)\s+(.*)$/)
    if (bullet) {
      flushPara()
      const isOrdered = !bullet[1]
      if (list && isOrdered !== ordered) flushList()
      if (!list) { list = []; ordered = isOrdered }
      list.push(bullet[2])
      continue
    }

    // A continuation line of a bullet item, or of a paragraph.
    if (list) list[list.length - 1] += ' ' + trimmed
    else para.push(trimmed)
  }
  flush()
  return blocks
}
