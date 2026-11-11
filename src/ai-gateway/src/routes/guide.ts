import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { routeGuideRequestSchema } from '../guide/guideRequest.schema.ts'
import { routeGuide } from '../guide/routeGuide.ts'
import { sendApiError } from './apiError.ts'
import { modelFor } from '../featureModels.ts'

export function registerGuideRoutes(app: FastifyInstance, { config, llm }: AppDeps) {
    app.post('/guide/intent', async (request, reply) => {
        const body = routeGuideRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await routeGuide(body.data, { llm, model: modelFor(config, 'editor-requests'), contextTokens: config.contextTokens })
            request.log.info({ guideId: result.guideId, hasMethod: Boolean(result.method), durationMs: result.durationMs }, 'guide routed')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'guide routing failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Guide routing failed')
        }
    })
}
