import cors from '@fastify/cors'
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import type { GatewayConfig } from './config.ts'
import type { InvokerRepository } from './invokers/invokerRepository.ts'
import type { LlmClient } from './llm/llmClient.ts'
import type { ScriptExamples } from './examples/scriptExamples.ts'
import type { TemplateFlows } from './examples/templateFlows.ts'
import type { OperationUsages } from './examples/operationUsages.ts'
import type { OperationRanker } from './invokers/focusConnectors.ts'
import type { DocsIndex } from './help/docsIndex.ts'
import type { Embedder } from './llm/ollamaEmbedder.ts'
import type { SpeechClient } from './speech/speechClient.ts'
import { registerHealthRoutes } from './routes/health.ts'
import { registerInvokerRoutes } from './routes/invokers.ts'
import { registerWorkflowRoutes } from './routes/workflow.ts'
import { registerScriptRoutes } from './routes/script.ts'
import { registerCommandRoutes } from './routes/command.ts'
import { registerSpeechRoutes } from './routes/speech.ts'
import { registerRunRoutes } from './routes/run.ts'
import { registerInvokerDraftRoutes } from './routes/invokerDraft.ts'
import { registerMappingRoutes } from './routes/mapping.ts'
import { registerExplainRoutes } from './routes/explain.ts'
import { registerConnectorErrorRoutes } from './routes/connectorError.ts'
import { registerNotificationRoutes } from './routes/notification.ts'
import { registerConditionRoutes } from './routes/condition.ts'
import { registerHelpRoutes } from './routes/help.ts'
import { registerGuideRoutes } from './routes/guide.ts'
import { registerEditorRoutes } from './routes/editor.ts'
import { registerSettingsRoutes } from './routes/settings.ts'
import type { SettingsStore } from './settings/gatewaySettings.ts'

export type AppDeps = {
    config: GatewayConfig
    llm: LlmClient
    invokers: InvokerRepository
    /** Example transformation scripts; without it, scripts are generated from the rules alone. */
    examples?: ScriptExamples
    /** Stored templates shown as worked examples when planning and building; without it, the model works alone. */
    templates?: TemplateFlows
    /** How templates call each operation, shown when building; without it, operations are filled from the invoker alone. */
    operationUsages?: OperationUsages
    /** Picks the operations of a too-large invoker to describe by meaning; without it, by shared words. */
    operationRanker?: OperationRanker
    /** The documentation the help assistant answers from; without it, every answer says the docs do not cover it. */
    docs?: DocsIndex
    /** Ranks palette commands by meaning; without it, by shared words. */
    embedder?: Embedder
    /** Turns spoken commands into text; without it, voice input is reported unavailable. */
    speech?: SpeechClient
    /** The AI settings page's changes; without it, `/settings` is not offered and the environment is all there is. */
    settings?: SettingsStore
}

export async function buildApp(deps: AppDeps, options: FastifyServerOptions = {}): Promise<FastifyInstance> {
    const app = Fastify(options)
    // The frontend's shared baseQuery sends `credentials: 'include'`; without this the browser drops every response.
    // PUT is for /settings; @fastify/cors allows only GET, HEAD and POST unless told otherwise.
    await app.register(cors, { origin: deps.config.corsOrigins, credentials: true, methods: ['GET', 'HEAD', 'POST', 'PUT'] })
    registerHealthRoutes(app, deps)
    registerInvokerRoutes(app, deps)
    registerWorkflowRoutes(app, deps)
    registerScriptRoutes(app, deps)
    registerCommandRoutes(app, deps)
    registerSpeechRoutes(app, deps)
    registerRunRoutes(app, deps)
    registerInvokerDraftRoutes(app, deps)
    registerMappingRoutes(app, deps)
    registerExplainRoutes(app, deps)
    registerConnectorErrorRoutes(app, deps)
    registerNotificationRoutes(app, deps)
    registerConditionRoutes(app, deps)
    registerHelpRoutes(app, deps)
    registerGuideRoutes(app, deps)
    registerEditorRoutes(app, deps)
    registerSettingsRoutes(app, deps)
    return app
}
