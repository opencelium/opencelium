import type { AppError } from '../types'

export function normalizeError(error: any): AppError {
    if (!error) {
        return {
            type: 'UNKNOWN',
            messageKey: 'unknown',
        }
    }

    const status = error.status || error.originalStatus

    switch (status) {
        case 400:
            return {
                type: 'VALIDATION',
                status,
                messageKey: 'validation',
                details: error.data,
            }

        case 401:
            return {
                type: 'UNAUTHORIZED',
                status,
                messageKey: 'unauthorized',
            }

        case 403:
            return {
                type: 'FORBIDDEN',
                status,
                messageKey: 'forbidden',
            }

        case 404:
            return {
                type: 'NOT_FOUND',
                status,
                messageKey: 'notFound',
            }

        case 500:
            return {
                type: 'SERVER',
                status,
                messageKey: error?.data?.message || error?.data?.error,
            }

        default:
            return {
                type: 'UNKNOWN',
                status,
                messageKey: 'unknown',
                originalError: error,
            }
    }
}
