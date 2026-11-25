export type GlobalReference = {
    raw: string
    name: string
    path: string
    start: number
    end: number
}

const NAME = String.raw`[A-Za-z][A-Za-z0-9_]{0,63}`
const PATH = String.raw`(?:\.[A-Za-z0-9_-]+|\[\d+\])*`

// Non-capturing on purpose: callers splice it into their own alternations and `split()` patterns.
// A leading backslash escapes the token (`\{{global.x}}` is literal text), as on the backend.
export const GLOBAL_REFERENCE_TOKEN = String.raw`(?<!\\)\{\{global\.${NAME}${PATH}\}\}`

const PARSE_RE = new RegExp(String.raw`(?<!\\)\{\{global\.(${NAME})(${PATH})\}\}`, 'g')
const WHOLE_RE = new RegExp(String.raw`^\{\{global\.(${NAME})(${PATH})\}\}$`)

export function findGlobalReferences(text: string): GlobalReference[] {
    return Array.from(text.matchAll(PARSE_RE), (match) => ({
        raw: match[0],
        name: match[1],
        path: match[2],
        start: match.index,
        end: match.index + match[0].length,
    }))
}

export function parseGlobalReference(text: string): Pick<GlobalReference, 'name' | 'path'> | null {
    const match = WHOLE_RE.exec(text.trim())
    return match ? { name: match[1], path: match[2] } : null
}

export const isGlobalReference = (text: string): boolean => parseGlobalReference(text) !== null

export const buildGlobalReference = (name: string, path = ''): string => `{{global.${name}${path}}}`

// Names referenced anywhere inside arbitrary data (graph nodes, field bindings). Lower-cased,
// because names are unique whatever their case on the backend.
export function collectGlobalNames(values: unknown[]): string[] {
    const names = new Set<string>()
    values.forEach((value) => {
        let text: string | undefined
        try {
            text = typeof value === 'string' ? value : JSON.stringify(value)
        } catch {
            return
        }
        if (text) findGlobalReferences(text).forEach((reference) => names.add(reference.name.toLowerCase()))
    })
    return [...names].sort()
}
