import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { suggestMapping, suggestMappingRequestSchema } from '../mapping/suggestMapping.ts'
import { sendApiError } from './apiError.ts'

/** Suggests which earlier value fills each request body field of a step. */
export function registerMappingRoutes(app: FastifyInstance, { config, llm }: AppDeps) {
    app.post('/mapping/suggest', async (request, reply) => {
        const body = suggestMappingRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await suggestMapping(body.data, { llm, model: config.workflowModel, contextTokens: config.contextTokens })
            request.log.info({ fieldCount: body.data.target.fields.length, sourceCount: body.data.sources.length,
                suggestionCount: result.suggestions.length, durationMs: result.durationMs }, 'mapping suggested')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'mapping suggestion failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Mapping suggestion failed')
        }
    })
}
