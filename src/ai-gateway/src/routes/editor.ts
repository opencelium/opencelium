import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { addMethodRequestSchema } from '../editor/addMethodRequest.schema.ts'
import { routeAddMethod } from '../editor/routeAddMethod.ts'
import { mappingRequestSchema } from '../editor/mappingRequest.schema.ts'
import { routeMapping } from '../editor/routeMapping.ts'
import { transformationRequestSchema } from '../editor/transformationRequest.schema.ts'
import { routeTransformation } from '../editor/routeTransformation.ts'
import { operatorRequestSchema } from '../editor/operatorRequest.schema.ts'
import { routeOperator } from '../editor/routeOperator.ts'
import { sendApiError } from './apiError.ts'

export function registerEditorRoutes(app: FastifyInstance, { config, llm, invokers, operationRanker }: AppDeps) {
    app.post('/workflow/add-method/intent', async (request, reply) => {
        const body = addMethodRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await routeAddMethod(body.data,
                { llm, model: config.commandModel, contextTokens: config.contextTokens, invokers, operationRanker })
            request.log.info({ hasConnector: Boolean(result.connectorId), operation: result.operation, position: result.position,
                hasStep: Boolean(result.stepId), durationMs: result.durationMs }, 'add-method routed')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'add-method routing failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Add-method routing failed')
        }
    })

    app.post('/workflow/mapping/intent', async (request, reply) => {
        const body = mappingRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await routeMapping(body.data, { llm, model: config.commandModel, contextTokens: config.contextTokens })
            request.log.info({ hasTarget: Boolean(result.target), hasSource: Boolean(result.source), durationMs: result.durationMs },
                'mapping request routed')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'mapping request routing failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Mapping request routing failed')
        }
    })

    app.post('/workflow/transformation/intent', async (request, reply) => {
        const body = transformationRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await routeTransformation(body.data, { llm, model: config.commandModel, contextTokens: config.contextTokens })
            request.log.info({ hasField: Boolean(result.field), hasDescription: Boolean(result.description), durationMs: result.durationMs },
                'transformation request routed')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'transformation request routing failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Transformation request routing failed')
        }
    })

    app.post('/workflow/add-operator/intent', async (request, reply) => {
        const body = operatorRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await routeOperator(body.data, { llm, model: config.commandModel, contextTokens: config.contextTokens })
            request.log.info({ kind: result.kind, position: result.position, hasStep: Boolean(result.stepId),
                hasCondition: Boolean(result.condition), durationMs: result.durationMs }, 'add-operator routed')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'add-operator routing failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Add-operator routing failed')
        }
    })
}
