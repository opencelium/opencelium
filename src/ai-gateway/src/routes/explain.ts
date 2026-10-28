import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { explainWorkflow, explainWorkflowRequestSchema } from '../explain/explainWorkflow.ts'
import { sendApiError } from './apiError.ts'

/** A description and a plain-language explanation of an existing workflow. */
export function registerExplainRoutes(app: FastifyInstance, { config, llm }: AppDeps) {
    app.post('/workflow/explain', async (request, reply) => {
        const body = explainWorkflowRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await explainWorkflow(body.data, { llm, model: config.workflowModel, contextTokens: config.contextTokens })
            request.log.info({ outlineLength: body.data.outline.length, durationMs: result.durationMs }, 'workflow explained')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'workflow explanation failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Workflow explanation failed')
        }
    })
}
