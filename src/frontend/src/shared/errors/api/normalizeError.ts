import type { ApiRequestDescriptor, AppError } from '../types'

// A sanity bound, not a display limit: the toast clamps what it shows and lets the
// user expand the rest (see ErrorNotificationText), so cutting here would only throw
// away the tail — which is where a validation list or a stack trace says what failed.
// This still keeps a runaway body (an HTML error page, a megabyte of JSON) out of the
// error state that every subscriber holds on to.
const MAX_SERVER_MESSAGE_LENGTH = 4000

const asNonEmptyString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined

const JAVA_EXCEPTION_CLASS = String.raw`(?:[a-z_$][\w$]*\.)+[A-Z][\w$]*(?:Exception|Error)`
const LEADING_JAVA_EXCEPTION = new RegExp(`^${JAVA_EXCEPTION_CLASS}:\\s*`)
const NESTED_JAVA_EXCEPTION = new RegExp(`\\s*\\(${JAVA_EXCEPTION_CLASS}\\b[^()]*\\)`, 'g')

/**
 * The backend forwards some exceptions verbatim ("java.text.ParseException: Illegal
 * cron expression format (java.lang.StringIndexOutOfBoundsException: …)."). The class
 * names and the nested cause mean nothing to the user, so drop them and keep the
 * sentence. Falls back to the original if nothing readable is left.
 */
const stripJavaExceptionNoise = (message: string): string => {
    const cleaned = message
        .replace(LEADING_JAVA_EXCEPTION, '')
        .replace(NESTED_JAVA_EXCEPTION, '')
        .trim()
    return cleaned || message
}

/**
 * The explanation the API sent with the failure, if any: the `message` (or
 * `error` code) of a JSON error body, or a plain-text body. Never an i18n key —
 * this is server text, shown as-is.
 */
const extractServerMessage = (error: unknown): string | undefined => {
    const data = (error as { data?: unknown } | null)?.data
    const body = data as { message?: unknown; error?: unknown } | null | undefined
    const rawMessage = typeof data === 'string'
        ? asNonEmptyString(data)
        : asNonEmptyString(body?.message) ?? asNonEmptyString(body?.error)
    if (!rawMessage) return undefined
    const message = stripJavaExceptionNoise(rawMessage)
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
