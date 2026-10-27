import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { createCommandIndex } from '../command/commandIndex.ts'
import { routeCommandRequestSchema, searchCommandsRequestSchema } from '../command/commandRequest.schema.ts'
import { routeCommand } from '../command/routeCommand.ts'
import { sendApiError } from './apiError.ts'

export function registerCommandRoutes(app: FastifyInstance, { config, llm, embedder }: AppDeps) {
    const index = createCommandIndex(embedder)

    app.post('/command/search', async (request, reply) => {
        const body = searchCommandsRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        return { matches: await index.rank(body.data.query, body.data.commands, body.data.limit) }
    })

    app.post('/command/route', async (request, reply) => {
        const body = routeCommandRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await routeCommand(body.data, { llm, index, model: config.commandModel, contextTokens: config.contextTokens })
            request.log.info({ commandId: result.commandId, durationMs: result.durationMs }, 'command routed')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'command routing failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Command routing failed')
        }
    })
}
