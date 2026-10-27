import { type CompatibilityIssue, checkNashornCompatibility } from '../nashorn/checkNashornCompatibility.ts'

// The checker reports message keys (the editor translates them); the repair prompt needs instructions the model can act on.
const SYNTAX_HINTS: Record<string, string> = {
    syntax: 'is not valid ECMAScript 5.1',
    arrowSyntax: 'uses an arrow function; write function () { ... }',
    templateSyntax: 'uses a template string; join strings with +',
    declarationSyntax: 'uses let or const; use var',
    classSyntax: 'uses a class; use functions',
    spreadSyntax: 'uses spread or rest (...); copy values in a loop',
    destructuringSyntax: 'uses destructuring; read each property separately',
    regexSyntax: 'uses a regular expression flag Nashorn lacks (u, y or s)',
}

function describeIssue(issue: CompatibilityIssue): string | undefined {
    const at = `(line ${issue.line})`
    switch (issue.kind) {
        case 'syntax':
            return `${SYNTAX_HINTS[issue.message] ?? SYNTAX_HINTS.syntax} ${at}. Nashorn runs ECMAScript 5.1 only`
        case 'unsupportedBuiltin':
            return `uses ${issue.message}, which Nashorn (ECMAScript 5.1) does not have ${at}; write it with a plain loop or indexOf`
        // Valid on the server (Java.type, load, Nashorn's own syntax) and Date only differs by timezone: not errors.
        case 'serverOnly':
        case 'timezone':
            return undefined
        default: {
            const _exhaustive: never = issue.kind
            return _exhaustive
        }
    }
}

const hasSyntaxError = (code: string) => checkNashornCompatibility(code).some((issue) => issue.kind === 'syntax')

/**
 * Models sometimes JSON-escape the code twice, so it arrives as one line with literal `\n`. Unescaped only when that
 * turns a syntax error into valid code: a single-line script may legitimately hold "\n" inside a string literal.
 */
export function unescapeScriptCode(code: string): string {
    if (code.includes('\n') || !code.includes('\\n') || !hasSyntaxError(code)) return code
    const unescaped = code.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"')
    return hasSyntaxError(unescaped) ? code : unescaped
}

/**
 * What a generated transformation must satisfy before it reaches the editor: the editor's own Nashorn check (shared
 * verbatim with the frontend, so anything the editor would flag gets repaired first), the result in `RESULT_VAR`, and
 * `VAR_n` only for the inputs the script declares.
 */
export function checkScript(code: string, inputCount: number): string[] {
    const problems = checkNashornCompatibility(code).flatMap((issue) => describeIssue(issue) ?? [])
    if (!/\bRESULT_VAR\s*=(?!=)/.test(code)) problems.push('never assigns RESULT_VAR')
    const unknown = [...new Set([...code.matchAll(/\bVAR_(\d+)\b/g)].map((match) => Number(match[1])))]
        .filter((index) => index >= inputCount)
    if (unknown.length) {
        problems.push(`uses ${unknown.map((index) => `VAR_${index}`).join(', ')} but has only ${inputCount} input(s) (VAR_0..VAR_${inputCount - 1})`)
    }
    return [...new Set(problems)]
}
