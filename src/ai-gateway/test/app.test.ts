import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { LlmClient } from '../src/llm/llmClient.ts'
import { helpdesk, tracker, validWorkflow } from './fixtures.ts'

const config = { ...loadConfig({}), workflowModel: 'test-model' }

const invokers: InvokerRepository = {
    async list() {
        return [tracker, helpdesk].map((invoker) => ({
            name: invoker.name,
            description: invoker.description,
            operationCount: invoker.operations.length,
        }))
    },
    async get(name) {
        return [tracker, helpdesk].find((invoker) => invoker.name.toLowerCase() === name.toLowerCase())
    },
}

function llm(overrides: Partial<LlmClient> = {}): LlmClient {
    return {
        async chat() {
            return { content: JSON.stringify(validWorkflow), promptTokens: 1, outputTokens: 1, durationMs: 1 }
        },
        async listModels() {
            return ['test-model']
        },
        ...overrides,
    }
}

describe('gateway HTTP API', () => {
    it('reports ok health when the model is available', async () => {
        const app = await buildApp({ config, llm: llm(), invokers })
        const response = await app.inject({ method: 'GET', url: '/health' })
        expect(response.json()).toMatchObject({ status: 'ok', workflowModel: { available: true }, invokerCount: 2 })
    })

    it('reports degraded health when Ollama is unreachable', async () => {
        const unreachable = llm({ listModels: () => Promise.reject(new Error('ECONNREFUSED')) })
        const app = await buildApp({ config, llm: unreachable, invokers })
        const response = await app.inject({ method: 'GET', url: '/health' })
        expect(response.json()).toMatchObject({ status: 'degraded', ollama: { reachable: false } })
    })

    it('generates a workflow', async () => {
        const app = await buildApp({ config, llm: llm(), invokers })
        const response = await app.inject({
            method: 'POST',
            url: '/workflow/generate',
            payload: { prompt: 'ticket per issue', from: 'tracker', to: 'Helpdesk' },
        })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({ dsl: validWorkflow, issues: [], model: 'test-model' })
    })

    it('rejects an empty prompt', async () => {
        const app = await buildApp({ config, llm: llm(), invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/generate', payload: { prompt: ' ', from: 'tracker' } })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({ error: { type: 'BAD_REQUEST' } })
    })

    it('returns 404 for an unknown invoker', async () => {
        const app = await buildApp({ config, llm: llm(), invokers })
        const response = await app.inject({
            method: 'POST',
            url: '/workflow/generate',
            payload: { prompt: 'x', from: 'tracker', to: 'nope' },
        })
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchObject({ error: { type: 'UNKNOWN_INVOKER' } })
    })

    it('maps a model failure to 502', async () => {
        const failing = llm({ chat: () => Promise.reject(new Error('fetch failed')) })
        const app = await buildApp({ config, llm: failing, invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/generate', payload: { prompt: 'x', from: 'tracker' } })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchObject({ error: { type: 'GENERATION_FAILED', message: 'fetch failed' } })
    })

    it('allows the frontend dev origin via CORS', async () => {
        const app = await buildApp({ config, llm: llm(), invokers })
        const response = await app.inject({ method: 'GET', url: '/health', headers: { origin: 'http://localhost:5173' } })
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
        expect(response.headers['access-control-allow-credentials']).toBe('true')
    })
})
