/** One section of the documentation: where it is, how to link it, and its text without reStructuredText markup. */
export type DocsSection = {
    /** e.g. `guides/schedule-and-notify` */
    page: string
    /** Page title first, then the headings down to this section. */
    titles: string[]
    /** The id Sphinx gives the section, for `<page>.html#<anchor>`. */
    anchor: string
    text: string
}

const UNDERLINE_RE = /^([=\-~^#*+"'`])\1{2,}\s*$/
// Directives whose content is no help as text: navigation, pictures and raw HTML.
const DROPPED_DIRECTIVES = /^\s*\.\.\s+(toctree|contents|image|figure|raw|only)::/
const MAX_SECTION_CHARS = 2500

/** Sphinx's section ids: lower case, runs of other characters as one hyphen. */
export const sectionAnchor = (title: string) =>
    title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Inline markup as plain text: `:doc:\`text <path>\`` → text, ``code`` → code, **bold** → bold. Works on whole
 * paragraphs, since markup wraps across lines; a role without its own text keeps the target's last part.
 */
export function plainInline(text: string): string {
    return text
        .replace(/:(?:doc|ref|term|guilabel|menuselection|kbd|code|file):`([^`<]*?)\s*(?:<([^>]*)>)?`/g,
            (_match, label: string, target?: string) => {
                const shown = target ? label.trim() || target : label.trim()
                // A bare page path reads as its last part: "../concepts/data-mapping" → "data mapping".
                return shown.includes('/') ? (shown.split('/').pop() ?? '').replace(/[-_]+/g, ' ') : shown
            })
        .replace(/``([^`]+)``/g, '$1')
        .replace(/`([^`<]+?)\s*<[^>]+>`_+/g, '$1')
        .replace(/\*\*([^*]+?)\*\*/g, '$1')
        .replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?]|$)/gm, '$1$2')
}

const indentOf = (line: string) => line.length - line.trimStart().length

/** Lines without the dropped directives and their indented content, labels and comment-only lines. */
function contentLines(lines: string[]): string[] {
    const kept: string[] = []
    let dropIndent: number | undefined
    for (const line of lines) {
        if (dropIndent !== undefined) {
            if (!line.trim() || indentOf(line) > dropIndent) continue
            dropIndent = undefined
        }
        if (DROPPED_DIRECTIVES.test(line)) {
            dropIndent = indentOf(line)
            continue
        }
        if (/^\s*\.\.\s+_[^:]+:\s*$/.test(line)) continue
        kept.push(line.replace(/^\s*\.\.\s+(note|warning|tip|important|caution|hint)::\s*/, (_match, kind: string) => `${kind.toUpperCase()}: `)
            .replace(/^\s*\.\.\s+(code-block|code|list-table)::.*$/, '')
            .replace(/^(\s*)\*\s+-\s+/, '$1- ')
            .replace(/^(\s*)\*\s+(?=\S)/, '$1- '))
    }
    return kept
}

const tidy = (lines: string[]) => plainInline(lines.join('\n')).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

/** Long sections are split at blank lines, so each piece stays a readable source and fits the answer's context. */
function pieces(text: string): string[] {
    if (text.length <= MAX_SECTION_CHARS) return [text]
    const parts: string[] = []
    let current = ''
    for (const paragraph of text.split(/\n\n+/)) {
        if (current && current.length + paragraph.length > MAX_SECTION_CHARS) {
            parts.push(current)
            current = ''
        }
        current = current ? `${current}\n\n${paragraph}` : paragraph
    }
    if (current) parts.push(current)
    return parts
}

/** A page's sections; heading levels follow the order the page first uses each underline style. */
export function parseDocsPage(page: string, source: string): DocsSection[] {
    const lines = source.replace(/\r\n/g, '\n').split('\n')
    const styles: string[] = []
    const sections: DocsSection[] = []
    let titles: string[] = []
    let body: string[] = []
    const flush = () => {
        const text = tidy(contentLines(body))
        const title = titles.at(-1)
        if (text && title) pieces(text).forEach((piece) => sections.push({ page, titles: [...titles], anchor: sectionAnchor(title), text: piece }))
        body = []
    }
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? ''
        const next = lines[index + 1] ?? ''
        const underline = UNDERLINE_RE.exec(next)
        const isTitle = line.trim() && !UNDERLINE_RE.test(line) && underline && next.trim().length >= line.trim().length
        if (!isTitle) {
            body.push(line)
            continue
        }
        const hasOverline = UNDERLINE_RE.test(lines[index - 1] ?? '') && lines[index - 1]?.[0] === next[0]
        if (hasOverline) body.pop()
        const style = `${hasOverline ? 'over' : ''}${next[0]}`
        if (!styles.includes(style)) styles.push(style)
        flush()
        const level = styles.indexOf(style)
        titles = [...titles.slice(0, level), plainInline(line.trim())]
        index += 1
    }
    flush()
    return sections
}
