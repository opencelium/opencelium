import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { draftNotification, draftNotificationRequestSchema } from '../notification/draftNotification.ts'
import { sendApiError } from './apiError.ts'

/** Drafts a notification template's subject and body. */
export function registerNotificationRoutes(app: FastifyInstance, { config, llm }: AppDeps) {
    app.post('/notification/draft', async (request, reply) => {
        const body = draftNotificationRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await draftNotification(body.data, { llm, model: config.workflowModel, contextTokens: config.contextTokens })
            request.log.info({ type: body.data.type, placeholderCount: body.data.placeholders.length,
                removedCount: result.removedPlaceholders.length, durationMs: result.durationMs }, 'notification drafted')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'notification draft failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Notification draft failed')
        }
    })
}
