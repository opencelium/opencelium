import type { GlobalVariableConflictError, GlobalVariableValidationError } from './types'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const readBody = (error: unknown, status: number): Record<string, unknown> | null =>
    isRecord(error) && error.status === status && isRecord(error.data) ? error.data : null

export function readConflict(error: unknown): GlobalVariableConflictError | null {
    const body = readBody(error, 409)
    if (!body || typeof body.code !== 'string') return null
    return {
        status: 409,
        error: 'GLOBAL_VARIABLE_CONFLICT',
        code: body.code as GlobalVariableConflictError['code'],
        message: typeof body.message === 'string' ? body.message : '',
        currentVersion: typeof body.currentVersion === 'number' ? body.currentVersion : undefined,
        blocking: Array.isArray(body.blocking) ? (body.blocking as GlobalVariableConflictError['blocking']) : [],
    }
}

export function readViolations(error: unknown): GlobalVariableValidationError['violations'] {
    const body = readBody(error, 400)
    return body && Array.isArray(body.violations) ? (body.violations as GlobalVariableValidationError['violations']) : []
}

export function readErrorMessage(error: unknown): string | null {
    if (!isRecord(error) || !isRecord(error.data)) return null
    return typeof error.data.message === 'string' ? error.data.message : null
}
