import type { ScriptErrorType } from '@features/workflow/script-sandbox/langCode.types'
import type { ScriptRunResult } from '@features/workflow/script-sandbox/sandbox.types'
import {
    parseInput,
    type InputValues,
} from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/playgroundInputs'
import type { JsonValue, ScriptErrorCode, ScriptParameter, ValidateScriptResponse } from '../../model/types'

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
        return { kind: 'value', value: response.result, resultType: response.resultJsonType ?? 'null', output: '', durationMs: response.durationMs ?? 0 }
    }
    if (error.code === 'VALIDATION_UNAVAILABLE') return null
    return {
        kind: 'error',
        output: '',
        durationMs: response.durationMs ?? 0,
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

/**
 * The backend takes the test arguments by position. Trailing missing ones are left out so the
 * script applies its defaults; a missing one before a given one gets its default (or null) in its place.
 */
export function toTestArguments(inputs: InputValues, parameters: ScriptParameter[]): { values: JsonValue[]; invalid: string[] } {
    const values: (JsonValue | undefined)[] = []
    const invalid: string[] = []
    parameters.forEach((parameter) => {
        const input = inputs[parameter.name]
        if (!input || input.mode === 'missing') {
            values.push(undefined)
            return
        }
        try {
            values.push(parseInput(input) as JsonValue)
        } catch {
            invalid.push(parameter.name)
            values.push(undefined)
        }
    })
    while (values.length > 0 && values[values.length - 1] === undefined) values.pop()
    return {
        values: values.map((value, index) => (value === undefined ? parameters[index].default ?? null : value)),
        invalid,
    }
}
