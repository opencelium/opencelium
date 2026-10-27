import { parse } from 'acorn'

/**
 * What a generated transformation must satisfy before it reaches the editor: Nashorn runs ECMAScript 5.1, the result
 * goes through `RESULT_VAR`, and `VAR_n` exists only for the inputs the script declares.
 */
export function checkScript(code: string, inputCount: number): string[] {
    const problems: string[] = []
    try {
        parse(code, { ecmaVersion: 5, sourceType: 'script' })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        problems.push(`is not valid ECMAScript 5.1 (Nashorn): ${message}. Use var and function, no let/const/arrow functions/template strings`)
    }
    if (!/\bRESULT_VAR\s*=(?!=)/.test(code)) problems.push('never assigns RESULT_VAR')
    const unknown = [...new Set([...code.matchAll(/\bVAR_(\d+)\b/g)].map((match) => Number(match[1])))]
        .filter((index) => index >= inputCount)
    if (unknown.length) {
        problems.push(`uses ${unknown.map((index) => `VAR_${index}`).join(', ')} but has only ${inputCount} input(s) (VAR_0..VAR_${inputCount - 1})`)
    }
    return problems
}
