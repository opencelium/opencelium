import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { buildInvokerXml } from '../invokerDraft/buildInvokerXml.ts'
import { draftFromDocs } from '../invokerDraft/draftFromDocs.ts'
import { invokerDraftSchema } from '../invokerDraft/invokerDraft.schema.ts'
import { openApiToDraft, parseOpenApi } from '../invokerDraft/openApiToDraft.ts'
import { sendApiError } from './apiError.ts'
import { modelFor } from '../featureModels.ts'

// OpenAPI descriptions of large systems run to megabytes (Netbox's is several); Fastify's default is 1 MB.
const MAX_DOCS_BYTES = 20 * 1024 * 1024

const draftRequestSchema = z.object({
    /** An OpenAPI / Swagger document (JSON or YAML), or documentation as text or HTML. */
    docs: z.string().trim().min(1),
    /** The system's name, when the user already knows what to call it. */
    name: z.string().trim().max(120).default(''),
})

const xmlRequestSchema = z.object({ draft: invokerDraftSchema })

/** Drafts an invoker from API documentation, and turns a reviewed draft into the backend's invoker XML. */
export function registerInvokerDraftRoutes(app: FastifyInstance, { config, llm }: AppDeps) {
    app.post('/invoker/draft', { bodyLimit: MAX_DOCS_BYTES }, async (request, reply) => {
        const body = draftRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        const spec = parseOpenApi(body.data.docs)
        if (spec) {
            const draft = openApiToDraft(spec)
            if (draft.operations.length === 0) return sendApiError(reply, 'BAD_REQUEST', 'The OpenAPI document describes no operations')
            const named = body.data.name ? { ...draft, name: body.data.name } : draft
            request.log.info({ source: 'openapi', operationCount: draft.operations.length }, 'invoker drafted')
            return { draft: named, source: 'openapi', isTruncated: false, durationMs: 0 }
        }
        try {
            const result = await draftFromDocs(body.data.docs, body.data.name, { llm, model: modelFor(config, 'invoker-from-docs'), contextTokens: config.contextTokens })
            request.log.info({ source: 'ai', operationCount: result.draft.operations.length, isTruncated: result.isTruncated,
                durationMs: result.durationMs }, 'invoker drafted')
            return { ...result, source: 'ai', model: modelFor(config, 'invoker-from-docs') }
        } catch (error) {
            request.log.error({ err: error }, 'invoker draft failed')
            return sendApiError(reply, 'GENERATION_FAILED', error instanceof Error ? error.message : 'Invoker draft failed')
        }
    })

    app.post('/invoker/xml', async (request, reply) => {
        const body = xmlRequestSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid draft', z.treeifyError(body.error))
        return { xml: buildInvokerXml(body.data.draft) }
    })
}
