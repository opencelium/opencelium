import type { FastifyReply } from 'fastify'

export type ApiErrorType = 'BAD_REQUEST' | 'UNKNOWN_INVOKER' | 'GENERATION_FAILED'

export type ApiErrorBody = {
    error: { type: ApiErrorType; message: string; details?: unknown }
}

const STATUS: Record<ApiErrorType, number> = {
    BAD_REQUEST: 400,
    UNKNOWN_INVOKER: 404,
    GENERATION_FAILED: 502,
}

export function sendApiError(reply: FastifyReply, type: ApiErrorType, message: string, details?: unknown) {
    const body: ApiErrorBody = { error: { type, message, details } }
    return reply.status(STATUS[type]).send(body)
}
