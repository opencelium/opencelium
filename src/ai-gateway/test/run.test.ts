import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { checkFix } from '../src/run/fixFailure.ts'
import { type RunFailure, runFailureSchema } from '../src/run/runFailure.ts'
import { helpdesk, tracker } from './fixtures.ts'

const invokers: InvokerRepository = {
    list: async () => [],
    get: async (name) => [tracker, helpdesk].find((invoker) => invoker.name.toLowerCase() === name.toLowerCase()),
}

function llmAnswering(...answers: object[]): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(request)
            const answer = answers[Math.min(requests.length - 1, answers.length - 1)]
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 2 }
        },
        async listModels() { return [] },
    }
}

const failedCall = {
    language: 'de',
    workflowTitle: 'Issues to tickets',
    failure: {
        kind: 'method', message: 'HTTP 400: title must not be empty', stepName: 'Create ticket', system: 'Helpdesk',
        operation: 'CreateTicket', context: ['for each issue of ListIssues'],
        request: { method: 'POST', url: 'https://helpdesk.test/tickets', body: '{"title":""}' },
        response: { status: '400', body: `{"error":"title must not be empty"}${'x'.repeat(5000)}` },
    },
    step: { url: '{url}/tickets', body: '{"title":"#FFCFB5.(response).success.issues[i].summary"}' },
    earlierSteps: [{ color: '#FFCFB5', name: 'List issues', operation: 'ListIssues', system: 'Tracker' }],
}

const post = async (url: string, payload: object, llm: LlmClient) => {
    const app = await buildApp({ config: loadConfig({}), llm, invokers })
    return app.inject({ method: 'POST', url, payload })
}

describe('POST /run/explain', () => {
    const explanation = { summary: 'Der Titel war leer.', cause: 'summary liegt unter fields.', fix: ['Pfad fields.summary verwenden'], isRequestFixable: true }

    it('tells the model the error, the call, the step config and the operation declaration, in the asked language', async () => {
        const llm = llmAnswering(explanation)
        const response = await post('/run/explain', failedCall, llm)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject(explanation)
        const told = llm.requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('HTTP 400: title must not be empty')
        expect(told).toContain('#FFCFB5: List issues (ListIssues on Tracker)\n    its response declares: issues[], issues[].key')
        expect(told).toContain('- CreateTicket: POST')
        expect(told).toContain('more characters')
        expect(told).toContain('Answer in German.')
    })

    it('never offers a request fix for a failed loop', async () => {
        const loop = { ...failedCall, failure: { ...failedCall.failure, kind: 'loop' }, step: undefined }
        const response = await post('/run/explain', loop, llmAnswering(explanation))
        expect(response.json().isRequestFixable).toBe(false)
    })

    it('rejects a malformed body', async () => {
        expect((await post('/run/explain', { failure: {} }, llmAnswering(explanation))).statusCode).toBe(400)
    })
})

describe('checkFix', () => {
    const failure: RunFailure = runFailureSchema.parse(failedCall)
    const declared = { invoker: helpdesk, operation: helpdesk.operations.find((op) => op.name === 'CreateTicket')! }

    it('accepts a valid fix', () => {
        expect(checkFix({ body: '{"title":"#FFCFB5.(response).success.issues[i].fields.summary"}', changes: ['x'] },
            failure, declared)).toEqual([])
    })

    it('flags broken JSON, unknown steps and invented fields', () => {
        expect(checkFix({ body: '{"title":', changes: [] }, failure, declared)).toContain('The body is no longer valid JSON')
        expect(checkFix({ body: '{"title":"#ABCDEF.(response).success.x"}', changes: [] }, failure, declared))
            .toContain('References to steps that do not exist: #ABCDEF')
        expect(checkFix({ body: '{"title":"a","urgency":"high"}', changes: [] }, failure, declared))
            .toContain('Fields the operation does not declare: urgency')
    })
})

describe('lost references', () => {
    const failure: RunFailure = runFailureSchema.parse(failedCall)

    it('flags a body whose references were replaced by values', () => {
        expect(checkFix({ body: '{"title":"Printer broken"}', changes: [] }, failure)).toEqual([
            expect.stringContaining('References of the configured body are missing (#FFCFB5.(response).success.issues[i].summary)'),
        ])
    })

    it('returns the configured body unchanged when the model keeps pasting values', async () => {
        const resolved = { body: '{"title":"Printer broken"}', changes: ['set the title'] }
        const response = await post('/run/fix', failedCall, llmAnswering(resolved))
        expect(response.json()).toMatchObject({ body: failedCall.step.body, changes: ['set the title'], problems: [] })
    })
})

describe('POST /run/fix', () => {
    it('returns the corrected call, after sending a broken first answer back once', async () => {
        const broken = { body: '{"title":"#ABCDEF.(response).success.x"}', changes: ['wrong'] }
        const good = { body: '{"title":"#FFCFB5.(response).success.issues[i].fields.summary"}',
            changes: ['title: issues[i].summary → issues[i].fields.summary'] }
        const llm = llmAnswering(broken, good)
        const response = await post('/run/fix', failedCall, llm)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({ ...good, problems: [] })
        expect(llm.requests).toHaveLength(2)
        expect(llm.requests[1]?.messages.at(-1)?.content).toContain('References to steps that do not exist: #ABCDEF')
    })

    it('refuses a failure that is not a method call', async () => {
        const response = await post('/run/fix', { ...failedCall, step: undefined }, llmAnswering({}))
        expect(response.statusCode).toBe(502)
    })
})
