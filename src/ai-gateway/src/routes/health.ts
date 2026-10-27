import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'

export type HealthResponse = {
    status: 'ok' | 'degraded'
    ollama: { reachable: boolean; models: string[] }
    workflowModel: { name: string; available: boolean }
    invokerCount: number
    speech: { available: boolean }
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
        const available = models.includes(config.workflowModel)
        return {
            status: reachable && available ? 'ok' : 'degraded',
            ollama: { reachable, models },
            workflowModel: { name: config.workflowModel, available },
            invokerCount: (await invokers.list()).length,
            speech: { available: Boolean(speech && (await speech.isReachable())) },
        }
    })
}
