import type { ApiRequestDescriptor, AppError } from '../types'

// Long enough for a real backend sentence, short enough that an HTML error page
// or a stack trace landing in the body can't turn the toast into a wall of text.
const MAX_SERVER_MESSAGE_LENGTH = 300

const asNonEmptyString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined

/**
 * The explanation the API sent with the failure, if any: the `message` (or
 * `error` code) of a JSON error body, or a plain-text body. Never an i18n key —
 * this is server text, shown as-is.
 */
const extractServerMessage = (error: unknown): string | undefined => {
    const data = (error as { data?: unknown } | null)?.data
    const body = data as { message?: unknown; error?: unknown } | null | undefined
    const message = typeof data === 'string'
        ? asNonEmptyString(data)
        : asNonEmptyString(body?.message) ?? asNonEmptyString(body?.error)
    if (!message) return undefined
    return message.length > MAX_SERVER_MESSAGE_LENGTH
        ? `${message.slice(0, MAX_SERVER_MESSAGE_LENGTH)}…`
        : message
}

export function normalizeError(error: any, request?: ApiRequestDescriptor): AppError {
    if (!error) {
        return {
            type: 'UNKNOWN',
            messageKey: 'unknown',
            request,
        }
    }

    const status = error.status || error.originalStatus
    const serverMessage = extractServerMessage(error)

    switch (status) {
        case 400:
            return {
                type: 'VALIDATION',
                status,
                messageKey: 'validation',
                serverMessage,
                request,
                details: error.data,
            }

        case 401:
            return {
                type: 'UNAUTHORIZED',
                status,
                messageKey: 'unauthorized',
                serverMessage,
                request,
            }

        case 403:
            return {
                type: 'FORBIDDEN',
                status,
                messageKey: 'forbidden',
                serverMessage,
                request,
            }

        case 404:
            return {
                type: 'NOT_FOUND',
                status,
                messageKey: 'notFound',
                serverMessage,
                request,
            }

        case 500:
            return {
                type: 'SERVER',
                status,
                // Backend code that throws a bare code as its message
                // ("CATEGORY_NOT_FOUND" from CategoryServiceImp) lands here, so the
                // message doubles as a translation key: it resolves when this project
                // has copy for that code, and falls back to generic copy plus
                // `serverMessage` when it doesn't.
                messageKey: asNonEmptyString(error?.data?.message)
                    ?? asNonEmptyString(error?.data?.error)
                    ?? 'unknown',
                serverMessage,
                request,
            }

        default:
            return {
                type: 'UNKNOWN',
                status,
                messageKey: 'unknown',
                serverMessage,
                request,
                originalError: error,
            }
    }
}
