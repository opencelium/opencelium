import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { explainConnectorError, explainConnectorErrorRequestSchema } from '../connectorError/explainConnectorError.ts'
import { sendApiError } from './apiError.ts'

/** Why a connector's test failed, and what to check. */
export function registerConnectorErrorRoutes(app: FastifyInstance, { config, llm, invokers }: AppDeps) {
    app.post('/connector/explain-error', async (request, reply) => {
        const body = explainConnectorErrorRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await explainConnectorError(body.data, { llm, invokers, model: config.workflowModel, contextTokens: config.contextTokens })
            // The error text may name hosts and accounts; only its kind is logged.
            request.log.info({ invoker: body.data.invoker, status: body.data.status, kind: result.kind, durationMs: result.durationMs }, 'connector error explained')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'connector error explanation failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Connector error explanation failed')
        }
    })
}
