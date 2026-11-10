import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { suggestCondition, suggestConditionRequestSchema } from '../condition/suggestCondition.ts'
import { suggestLoop, suggestLoopRequestSchema } from '../condition/suggestLoop.ts'
import { sendApiError } from './apiError.ts'

/** Turns a plain-language condition into the rules of an if step, or a description of a loop into its loop. */
export function registerConditionRoutes(app: FastifyInstance, { config, llm }: AppDeps) {
    app.post('/condition/suggest', async (request, reply) => {
        const body = suggestConditionRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await suggestCondition(body.data, { llm, model: config.workflowModel, contextTokens: config.contextTokens })
            request.log.info({ sourceCount: body.data.sources.length, ruleCount: result.rules.length, durationMs: result.durationMs }, 'condition suggested')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'condition suggestion failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Condition suggestion failed')
        }
    })

    app.post('/condition/loop', async (request, reply) => {
        const body = suggestLoopRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await suggestLoop(body.data, { llm, model: config.workflowModel, contextTokens: config.contextTokens })
            request.log.info({ sourceCount: body.data.sources.length, operator: result.operator, durationMs: result.durationMs }, 'loop suggested')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'loop suggestion failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Loop suggestion failed')
        }
    })
}
