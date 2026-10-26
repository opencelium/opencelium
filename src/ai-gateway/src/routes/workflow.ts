import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { generateWorkflow } from '../workflow/generateWorkflow.ts'
import { sendApiError } from './apiError.ts'

export const generateWorkflowRequestSchema = z.object({
    prompt: z.string().trim().min(1).max(4000),
    from: z.string().trim().min(1),
    to: z.string().trim().min(1).optional(),
})

export type GenerateWorkflowRequest = z.infer<typeof generateWorkflowRequestSchema>

export function registerWorkflowRoutes(app: FastifyInstance, { config, llm, invokers }: AppDeps) {
    app.post('/workflow/generate', async (request, reply) => {
        const body = generateWorkflowRequestSchema.safeParse(request.body)
        if (!body.success) {
            return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        }
        const { prompt, from: fromName, to: toName } = body.data

        const from = await invokers.get(fromName)
        if (!from) return sendApiError(reply, 'UNKNOWN_INVOKER', `Unknown invoker "${fromName}"`)
        const to = toName === undefined ? null : await invokers.get(toName)
        if (to === undefined) return sendApiError(reply, 'UNKNOWN_INVOKER', `Unknown invoker "${toName}"`)

        try {
            const result = await generateWorkflow(prompt, { from, to }, {
                llm,
                model: config.workflowModel,
                contextTokens: config.contextTokens,
                maxRepairAttempts: config.maxRepairAttempts,
            })
            request.log.info(
                { from: from.name, to: to?.name, attempts: result.attempts, issueCount: result.issues.length },
                'workflow generated',
            )
            return result
        } catch (error) {
            request.log.error({ err: error }, 'workflow generation failed')
            const message = error instanceof Error ? error.message : 'Workflow generation failed'
            return sendApiError(reply, 'GENERATION_FAILED', message)
        }
    })
}
