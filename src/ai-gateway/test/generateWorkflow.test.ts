import { describe, expect, it } from 'vitest'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { generateWorkflow } from '../src/workflow/generateWorkflow.ts'
import { connectors, validWorkflow } from './fixtures.ts'

const brokenWorkflow = {
    steps: [{ ...validWorkflow.steps[1], over: { step: 's7', path: 'issues' } }],
}

function scriptedLlm(answers: string[]): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(structuredClone(request))
            const content = answers[requests.length - 1] ?? answers.at(-1) ?? ''
            return { content, promptTokens: 100, outputTokens: 50, durationMs: 10 }
        },
        async listModels() {
            return []
        },
    }
}

const deps = (llm: LlmClient) => ({ llm, model: 'test-model', contextTokens: 4096, maxRepairAttempts: 2 })

describe('generateWorkflow', () => {
    it('returns the first answer when it is valid', async () => {
        const llm = scriptedLlm([JSON.stringify(validWorkflow)])
        const result = await generateWorkflow('tickets for issues', connectors, deps(llm))
        expect(result.dsl).toEqual(validWorkflow)
        expect(result.issues).toEqual([])
        expect(result.attempts).toHaveLength(1)
        expect(llm.requests[0]?.format).toHaveProperty('$defs')
    })

    it('sends the errors back and accepts the repaired answer', async () => {
        const llm = scriptedLlm([JSON.stringify(brokenWorkflow), JSON.stringify(validWorkflow)])
        const result = await generateWorkflow('tickets for issues', connectors, deps(llm))
        expect(result.dsl).toEqual(validWorkflow)
        expect(result.attempts.map((attempt) => attempt.errorCount)).toEqual([1, 0])
        const repair = llm.requests[1]?.messages.at(-1)
        expect(repair?.role).toBe('user')
        expect(repair?.content).toContain('"s7"')
        expect(llm.requests.map((request) => request.temperature)).toEqual([0, 0.4])
    })

    it('stops after the repair budget and returns the best attempt with its issues', async () => {
        const llm = scriptedLlm(['not json', JSON.stringify(brokenWorkflow)])
        const result = await generateWorkflow('tickets for issues', connectors, deps(llm))
        expect(llm.requests).toHaveLength(3)
        expect(result.dsl).toEqual(brokenWorkflow)
        expect(result.issues.some((issue) => issue.severity === 'error')).toBe(true)
    })

    it('fails when no attempt can be parsed', async () => {
        const llm = scriptedLlm(['not json'])
        await expect(generateWorkflow('x', connectors, deps(llm))).rejects.toThrow(/parseable/)
    })
})
