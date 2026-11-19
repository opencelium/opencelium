import type { ScriptLanguage, ScriptRef, ScriptRefType } from './types'

// Languages the script editor offers today; Python and Ruby wait for the polyglot service (phase 4).
export const SCRIPT_LANGUAGES = ['js'] as const satisfies readonly ScriptLanguage[]

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
    code: 'return null;',
    parameters: [],
    imports: [],
})

export type DetectedRef = ScriptRef & { line: number; column: number; length: number }

export type RefIssue = { line: number; column: number }

// ref("…") with a string literal is what the backend can resolve before the run (FR-46).
const LITERAL_REF_RE = /\bref\(\s*(["'])((?:\\.|(?!\1).)*)\1\s*\)/g
const ANY_REF_RE = /\bref\(/g

export const refTypeOf = (ref: string): ScriptRefType => {
    if (ref.startsWith('{{global.')) return 'GLOBAL'
    if (ref.startsWith('${')) return 'WEBHOOK'
    if (ref.startsWith('@{')) return 'PAGE'
    if (/^#?[A-Fa-f0-9]{6}\./.test(ref)) return 'METHOD_RESPONSE'
    return 'REQUEST_DATA'
}

/** The references the editor can see before the backend analyses the script. */
export function detectRefs(code: string): { refs: DetectedRef[]; nonLiteral: RefIssue[] } {
    const refs: DetectedRef[] = []
    const nonLiteral: RefIssue[] = []
    code.split('\n').forEach((text, row) => {
        const literalStarts = new Set<number>()
        for (const match of text.matchAll(LITERAL_REF_RE)) {
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
        for (const match of text.matchAll(ANY_REF_RE)) {
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
