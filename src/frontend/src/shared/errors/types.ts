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
    // Toast lifetime in seconds. Undefined → sticky: error notifications stay until
    // the user clicks their close icon. Set a positive value to auto-close instead.
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

// Props handed to a boundary fallback so it can offer recovery.
export type CrashFallbackProps = {
    // Clears the caught error and re-mounts the boundary's subtree.
    reset: () => void
    scope: BoundaryErrorScope
    error?: Error
}
