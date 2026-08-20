/** A call as its caller issued it: relative or absolute URL, method defaulting to GET. */
export type ApiRequestDescriptor = {
    method?: string
    url: string
}

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
    // What the API itself said (its `{message}` / `{error}` body, or a plain-text
    // body), untranslated and capped in length. The generic translated copy for a
    // status code rarely says why the request failed, so this is shown alongside it
    // rather than swallowed. Absent when the response carried no explanation.
    serverMessage?: string
    // The call that failed, when the error came from one. Lets the toast lead with
    // the operation the user was waiting on ("Could not load Connectors") instead of
    // its status code. Absent for errors emitted by hand (login flows, sockets).
    request?: ApiRequestDescriptor
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
