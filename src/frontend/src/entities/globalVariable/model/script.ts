import type { ScriptLanguage } from './types'

export const SCRIPT_LANGUAGES = ['js', 'python3', 'ruby'] as const satisfies readonly ScriptLanguage[]

export const DEFAULT_CODE: Record<ScriptLanguage, string> = {
    js: 'return null;',
    python3: 'return None',
    ruby: 'return nil',
}

export const PARAMETER_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/
export const MAX_SCRIPT_BYTES = 256 * 1024
// The backend refuses a longer one with PARAMETER_INVALID.
export const PARAMETER_DESCRIPTION_MAX_LENGTH = 512

export type ScriptParameterDraft = { name: string; description: string; required: boolean; defaultText: string }

export type ScriptFormValues = {
    language: ScriptLanguage
    code: string
    parameters: ScriptParameterDraft[]
}

export const emptyScript = (): ScriptFormValues => ({
    language: 'js',
    code: DEFAULT_CODE.js,
    parameters: [],
})

export type ImpureCall = { line: number; column: number }

// A script uses only its parameters: the backend refuses ref() and set() (SCRIPT_NOT_PURE).
const IMPURE_CALL_RE = /(?<![\w$.])(?:ref|set)\(/g
// Ruby may also call them without parentheses: ref "…".
const RUBY_IMPURE_CALL_RE = /(?<![\w$.])(?:ref|set)(?:\(|\s+(?=["']))/g

export function detectImpureCalls(code: string, language: ScriptLanguage = 'js'): ImpureCall[] {
    const pattern = language === 'ruby' ? RUBY_IMPURE_CALL_RE : IMPURE_CALL_RE
    return code.split('\n').flatMap((text, row) =>
        [...text.matchAll(pattern)].map((match) => ({ line: row + 1, column: match.index + 1 })))
}

export function parameterProblems(parameters: ScriptParameterDraft[]): string | null {
    const names = parameters.map((parameter) => parameter.name.trim())
    if (names.some((name) => !PARAMETER_NAME_PATTERN.test(name))) return 'invalidName'
    if (new Set(names).size !== names.length) return 'duplicateName'
    return null
}
