import cors from '@fastify/cors'
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import type { GatewayConfig } from './config.ts'
import type { InvokerRepository } from './invokers/invokerRepository.ts'
import type { LlmClient } from './llm/llmClient.ts'
import type { ScriptExamples } from './examples/scriptExamples.ts'
import { registerHealthRoutes } from './routes/health.ts'
import { registerInvokerRoutes } from './routes/invokers.ts'
import { registerWorkflowRoutes } from './routes/workflow.ts'

export type AppDeps = {
    config: GatewayConfig
    llm: LlmClient
    invokers: InvokerRepository
    /** Example transformation scripts; without it, scripts are generated from the rules alone. */
    examples?: ScriptExamples
}

export async function buildApp(deps: AppDeps, options: FastifyServerOptions = {}): Promise<FastifyInstance> {
    const app = Fastify(options)
    // The frontend's shared baseQuery sends `credentials: 'include'`; without this the browser drops every response.
    await app.register(cors, { origin: deps.config.corsOrigins, credentials: true })
    registerHealthRoutes(app, deps)
    registerInvokerRoutes(app, deps)
    registerWorkflowRoutes(app, deps)
    return app
}
