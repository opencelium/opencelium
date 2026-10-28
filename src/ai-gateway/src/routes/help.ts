import { Readable } from 'node:stream'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { createCommandIndex } from '../command/commandIndex.ts'
import { answerHelp, helpRequestSchema } from '../help/answerHelp.ts'
import { noDocsIndex } from '../help/docsIndex.ts'
import { sendApiError } from './apiError.ts'

/**
 * The help assistant. The answer streams as newline-delimited JSON (sources, text pieces, offered commands), so the
 * panel shows the sources at once and the answer as it is written; a 14b answer takes tens of seconds.
 */
export function registerHelpRoutes(app: FastifyInstance, { config, llm, embedder, docs = noDocsIndex }: AppDeps) {
    const commands = createCommandIndex(embedder)
    app.post('/help/ask', async (request, reply) => {
        const body = helpRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        const help = body.data
        const started = Date.now()
        const events = answerHelp(help, { llm, docs, commands, model: config.helpModel, rewriteModel: config.commandModel,
            contextTokens: config.contextTokens, docsUrl: config.docsUrl })
        async function* lines() {
            try {
                for await (const event of events) yield `${JSON.stringify(event)}\n`
            } catch (error) {
                request.log.error({ err: error }, 'help answer failed')
                yield `${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Help answer failed' })}\n`
            }
            // Questions may hold customer details; only the conversation's size is logged.
            request.log.info({ turns: help.messages.length, durationMs: Date.now() - started }, 'help answered')
        }
        return reply.type('application/x-ndjson').send(Readable.from(lines()))
    })
}
