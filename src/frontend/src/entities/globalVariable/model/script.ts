import type { ScriptLanguage, ScriptRef, ScriptRefType } from './types'

// Python and Ruby run on the polyglot service; until it validates, a test run answers VALIDATION_UNAVAILABLE.
export const SCRIPT_LANGUAGES = ['js', 'python3', 'python2', 'ruby'] as const satisfies readonly ScriptLanguage[]

export const DEFAULT_CODE: Record<ScriptLanguage, string> = {
    js: 'return null;',
    python2: 'return None',
    python3: 'return None',
    ruby: 'return nil',
}

export const PARAMETER_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/
export const MAX_SCRIPT_BYTES = 256 * 1024

export type ScriptParameterDraft = { name: string; required: boolean; defaultText: string }

export type ScriptFormValues = {
    language: ScriptLanguage
    code: string
    parameters: ScriptParameterDraft[]
    imports: string[]
}

export const emptyScript = (): ScriptFormValues => ({
    language: 'js',
    code: DEFAULT_CODE.js,
    parameters: [],
    imports: [],
})

export type DetectedRef = ScriptRef & { line: number; column: number; length: number }

export type RefIssue = { line: number; column: number }

// ref("…") with a string literal is what the backend can resolve before the run (FR-46).
const LITERAL_REF_RE = /\bref\(\s*(["'])((?:\\.|(?!\1).)*)\1\s*\)/g
const ANY_REF_RE = /\bref\(/g
// Ruby may also call it without parentheses: ref "…".
const RUBY_LITERAL_REF_RE = /\bref(?:\(\s*|\s+)(["'])((?:\\.|(?!\1).)*)\1\s*\)?/g
const RUBY_ANY_REF_RE = /\bref(?:\(|\s+(?=[^\s=]))/g

export const refTypeOf = (ref: string): ScriptRefType => {
    if (ref.startsWith('{{global.')) return 'GLOBAL'
    if (ref.startsWith('${')) return 'WEBHOOK'
    if (ref.startsWith('@{')) return 'PAGE'
    if (/^#?[A-Fa-f0-9]{6}\./.test(ref)) return 'METHOD_RESPONSE'
    return 'REQUEST_DATA'
}

/** The references the editor can see before the backend analyses the script. */
export function detectRefs(code: string, language: ScriptLanguage = 'js'): { refs: DetectedRef[]; nonLiteral: RefIssue[] } {
    const literalRe = language === 'ruby' ? RUBY_LITERAL_REF_RE : LITERAL_REF_RE
    const anyRe = language === 'ruby' ? RUBY_ANY_REF_RE : ANY_REF_RE
    const refs: DetectedRef[] = []
    const nonLiteral: RefIssue[] = []
    code.split('\n').forEach((text, row) => {
        const literalStarts = new Set<number>()
        for (const match of text.matchAll(literalRe)) {
            literalStarts.add(match.index)
            const ref = match[2]
            const type = refTypeOf(ref)
            refs.push({
                ref,
                type,
                ...(type === 'METHOD_RESPONSE' ? { warning: 'TIED_TO_CALLER_COLORS' as const } : {}),
                line: row + 1,
                column: match.index + 1,
                length: match[0].length,
            })
        }
        for (const match of text.matchAll(anyRe)) {
            if (!literalStarts.has(match.index)) nonLiteral.push({ line: row + 1, column: match.index + 1 })
        }
    })
    return { refs, nonLiteral }
}

export const uniqueRefs = (refs: DetectedRef[]): DetectedRef[] =>
    refs.filter((ref, index) => refs.findIndex((other) => other.ref === ref.ref) === index)

export function parameterProblems(parameters: ScriptParameterDraft[]): string | null {
    const names = parameters.map((parameter) => parameter.name.trim())
    if (names.some((name) => !PARAMETER_NAME_PATTERN.test(name))) return 'invalidName'
    if (new Set(names).size !== names.length) return 'duplicateName'
    return null
}
