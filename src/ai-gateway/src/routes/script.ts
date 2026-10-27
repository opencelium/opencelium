import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { noScriptExamples } from '../examples/scriptExamples.ts'
import { generateScript, generateScriptRequestSchema } from '../script/generateScript.ts'
import { sendApiError } from './apiError.ts'

export function registerScriptRoutes(app: FastifyInstance, { config, llm, examples = noScriptExamples }: AppDeps) {
    app.post('/script/generate', async (request, reply) => {
        const body = generateScriptRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        try {
            const result = await generateScript(body.data, { llm, model: config.workflowModel, contextTokens: config.contextTokens, examples })
            request.log.info({ inputCount: body.data.inputs.length, problemCount: result.problems.length, durationMs: result.durationMs }, 'script generated')
            return result
        } catch (error) {
            request.log.error({ err: error }, 'script generation failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Script generation failed')
        }
    })
}
