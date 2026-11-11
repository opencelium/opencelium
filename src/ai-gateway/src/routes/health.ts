import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import { type AiFeature, FEATURE_MODELS, modelFor } from '../featureModels.ts'

export type HealthResponse = {
    status: 'ok' | 'degraded'
    ollama: { reachable: boolean; models: string[] }
    workflowModel: { name: string; available: boolean }
    invokerCount: number
    speech: { available: boolean }
    /** Which model each feature runs on, and whether Ollama has it; for the app's AI settings page. */
    features: { id: AiFeature; model: string; available: boolean }[]
    embedModel: { name: string; available: boolean }
}

export function registerHealthRoutes(app: FastifyInstance, { config, llm, invokers, speech }: AppDeps) {
    app.get('/health', async (): Promise<HealthResponse> => {
        let models: string[] = []
        let reachable = true
        try {
            models = await llm.listModels()
        } catch {
            reachable = false
        }
        // Ollama lists tags in full ("nomic-embed-text:latest"); a bare name means :latest.
        const has = (model: string) => models.includes(model) || models.includes(`${model}:latest`)
        const available = has(config.workflowModel)
        return {
            status: reachable && available ? 'ok' : 'degraded',
            ollama: { reachable, models },
            workflowModel: { name: config.workflowModel, available },
            invokerCount: (await invokers.list()).length,
            speech: { available: Boolean(speech && (await speech.isReachable())) },
            features: (Object.keys(FEATURE_MODELS) as AiFeature[]).map((id) => {
                const model = modelFor(config, id)
                return { id, model, available: has(model) }
            }),
            embedModel: { name: config.embedModel, available: has(config.embedModel) },
        }
    })
}
