import { describe, expect, it } from 'vitest'
import type { LlmClient } from '../src/llm/llmClient.ts'
import { buildPlanSystemPrompt } from '../src/plan/buildPlanPrompt.ts'
import { generatePlan } from '../src/plan/generatePlan.ts'
import { connectors } from './fixtures.ts'

const llmAnswering = (content: string): LlmClient & { system?: string } => {
    const client: LlmClient & { system?: string } = {
        async chat(request) {
            client.system = request.messages[0]?.content
            return { content, promptTokens: 1, outputTokens: 1, durationMs: 5 }
        },
        async listModels() {
            return []
        },
    }
    return client
}
const deps = (llm: LlmClient) => ({ llm, model: 'test-model', contextTokens: 4096 })

describe('generatePlan', () => {
    it('returns the plan and pins the first step to the root', async () => {
        const llm = llmAnswering(JSON.stringify({ pattern: 'sync', steps: [{ text: 'Read issues with ListIssues', depth: 1 }, { text: 'For each issue', depth: 0 }] }))
        const plan = await generatePlan('sync issues', connectors, deps(llm))
        expect(plan).toMatchObject({ pattern: 'sync', model: 'test-model', steps: [{ depth: 0 }, { depth: 0 }] })
    })

    it('rejects answers that are not a plan', async () => {
        await expect(generatePlan('x', connectors, deps(llmAnswering('nope')))).rejects.toThrow(/parseable plan/)
        await expect(generatePlan('x', connectors, deps(llmAnswering('{"steps":[]}')))).rejects.toThrow(/usable plan/)
    })

    it('gives the model the sync skeleton and the connectors\' operations', () => {
        const system = buildPlanSystemPrompt(connectors)
        expect(system).toContain('pattern "sync"')
        expect(system).toContain('ListIssues')
        expect(system).toContain('CreateTicket')
    })
})
