export type AppErrorType =
    | 'NETWORK'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION'
    | 'SERVER'
    | 'UNKNOWN'

export type AppError = {
    type: AppErrorType
    status?: number
    messageKey: string        // i18n key
    details?: unknown
    originalError?: unknown
    // Toast lifetime in seconds. Undefined → antd default (3s). 0 → sticky.
    durationSec?: number
}

export type BoundaryError = {
    error: Error
    errorInfo?: {
        componentStack: string | null | undefined,
    }
    scope: BoundaryErrorScope
}

export type BoundaryErrorScope = 'app' | 'page' | 'widget'
