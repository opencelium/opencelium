import type { ScriptErrorType } from '@features/workflow/script-sandbox/langCode.types'
import type { ScriptRunResult } from '@features/workflow/script-sandbox/sandbox.types'
import {
    parseInput,
    type InputValues,
} from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/playgroundInputs'
import type { JsonValue, ScriptErrorCode, ValidateScriptResponse } from '../../model/types'

type Translate = (key: string, options?: Record<string, unknown>) => string

const ERROR_TYPES: Partial<Record<ScriptErrorCode, ScriptErrorType>> = {
    SCRIPT_SYNTAX: 'SYNTAX',
    SCRIPT_RUNTIME: 'RUNTIME',
    SCRIPT_TIMEOUT: 'TIMEOUT',
}

/** The playground's result shape for a validate-script response; null when the backend can't run scripts. */
export function toRunResult(response: ValidateScriptResponse, t: Translate): ScriptRunResult | null {
    const { error } = response
    if (!error) {
        return { kind: 'value', value: response.result, resultType: response.resultJsonType, output: '', durationMs: response.durationMs }
    }
    if (error.code === 'VALIDATION_UNAVAILABLE') return null
    return {
        kind: 'error',
        output: '',
        durationMs: response.durationMs,
        error: {
            type: ERROR_TYPES[error.code] ?? 'RESULT',
            name: null,
            line: error.line ?? null,
            column: error.column ?? null,
            message: error.message,
            codeLine: null,
            hint: t(`global-variable.script.errors.${error.code}`, { defaultValue: error.code }),
        },
    }
}

export function warningNotes(response: ValidateScriptResponse, t: Translate): string[] {
    return response.warnings.map((warning) => {
        const where = warning.line ? `, ${t('global-variable.script.test.atLine', { line: warning.line })}` : ''
        return `${t(`global-variable.script.warnings.${warning.code}`)} (${warning.ref}${where})`
    })
}

/** Missing inputs are left out, so the run applies its own rule (default value, or null for a reference). */
export function toTestValues(inputs: InputValues, keys: string[]): { values: Record<string, JsonValue>; invalid: string[] } {
    const values: Record<string, JsonValue> = {}
    const invalid: string[] = []
    keys.forEach((key) => {
        const input = inputs[key]
        if (!input || input.mode === 'missing') return
        try {
            values[key] = parseInput(input) as JsonValue
        } catch {
            invalid.push(key)
        }
    })
    return { values, invalid }
}
