import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { type RunAiDeps, explainFailure } from '../run/explainFailure.ts'
import { fixFailure } from '../run/fixFailure.ts'
import { type RunFailure, runFailureSchema } from '../run/runFailure.ts'
import { sendApiError } from './apiError.ts'

type RunAi = (failure: RunFailure, deps: RunAiDeps) => Promise<{ durationMs: number }>

/** Explains a failed test run, and proposes a corrected request for a failed method call. */
export function registerRunRoutes(app: FastifyInstance, { config, llm, invokers }: AppDeps) {
    const deps: RunAiDeps = { llm, invokers, model: config.lightModel, contextTokens: config.contextTokens }
    const handle = (what: string, run: RunAi) => async (request: FastifyRequest, reply: FastifyReply) => {
        const body = runFailureSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await run(body.data, deps)
            // Payloads and messages may hold customer data; only their shape is logged.
            request.log.info({ kind: body.data.failure.kind, system: body.data.failure.system, durationMs: result.durationMs }, `${what} done`)
            return result
        } catch (error) {
            request.log.error({ err: error }, `${what} failed`)
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : `${what} failed`)
        }
    }
    app.post('/run/explain', handle('run explanation', explainFailure))
    app.post('/run/fix', handle('run fix', fixFailure))
}
