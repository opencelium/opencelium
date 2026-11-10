import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const request = {
    language: 'de',
    instruction: 'only tickets with priority high that are not closed',
    sources: [
        { id: 's1', step: 'Get tickets', system: 'Zammad', path: 'tickets[i].priority' },
        { id: 's2', step: 'Get tickets', system: 'Zammad', path: 'tickets[i].state' },
    ],
}

const appAnswering = async (answer: object) => {
    const requests: ChatRequest[] = []
    const llm: LlmClient = {
        async chat(chat) {
            requests.push(chat)
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 2 }
        },
        async listModels() { return [] },
    }
    const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
    return { app: await buildApp({ config: loadConfig({}), llm, invokers }), requests }
}

describe('POST /condition/suggest', () => {
    it('returns the rules, with unary operators carrying no right side and incomplete comparisons dropped', async () => {
        const { app, requests } = await appAnswering({ conjunction: 'and', not: false, explanation: 'Hohe Priorität, nicht geschlossen', rules: [
            { left: 's1', operator: '=', right: { kind: 'value', value: 'high' } },
            { left: 's2', operator: '!=', right: { kind: 'value', value: 'closed' } },
            { left: 's2', operator: 'NotEmpty', right: { kind: 'value', value: 'x' } },
            { left: 's1', operator: '>', right: { kind: 'none' } },
        ] })
        const response = await app.inject({ method: 'POST', url: '/condition/suggest', payload: request })
        expect(response.json().rules).toEqual([
            { left: 's1', operator: '=', right: { kind: 'value', value: 'high' } },
            { left: 's2', operator: '!=', right: { kind: 'value', value: 'closed' } },
            { left: 's2', operator: 'NotEmpty', right: { kind: 'none' } },
        ])
        const told = requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('- ContainsSubStr: the text on the left contains the value as part of it')
        expect(told).toContain('- s2: Get tickets (Zammad) › tickets[i].state')
        expect(JSON.stringify(requests[0]?.format)).toContain('"enum":["s1","s2"]')
    })

    it('fails when no usable rule is left', async () => {
        const { app } = await appAnswering({ conjunction: 'and', not: false, explanation: '', rules: [{ left: 's1', operator: '=', right: { kind: 'none' } }] })
        expect((await app.inject({ method: 'POST', url: '/condition/suggest', payload: request })).statusCode).toBe(502)
    })
})

describe('POST /condition/loop', () => {
    const loopRequest = {
        language: 'en',
        instruction: 'for each issue of SearchIssues',
        sources: [
            { id: 's1', step: 'SearchIssues', system: 'Jira', path: 'issues[*]', kind: 'list' },
            { id: 's2', step: 'SearchIssues', system: 'Jira', path: 'names', kind: 'object' },
            { id: 's3', step: 'SearchIssues', system: 'Jira', path: 'expand', kind: 'text' },
        ],
    }

    it('returns the operator and the value to loop over', async () => {
        const { app, requests } = await appAnswering({ operator: 'for', source: 's1', delimiter: '', explanation: 'Repeats for each issue.' })
        const response = await app.inject({ method: 'POST', url: '/condition/loop', payload: loopRequest })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({ operator: 'for', source: 's1', delimiter: '', explanation: 'Repeats for each issue.' })
        expect(String(requests[0]?.messages[1]?.content)).toContain('s1 [list]: SearchIssues (Jira) › issues[*]')
    })

    it('takes the operator from the kind of the value chosen, and a delimiter only for split text', async () => {
        const { app } = await appAnswering({ operator: 'for', source: 's3', delimiter: '', explanation: 'x' })
        const text = await app.inject({ method: 'POST', url: '/condition/loop', payload: loopRequest })
        expect(text.json()).toMatchObject({ operator: 'SplitString', source: 's3', delimiter: ',' })
        const { app: other } = await appAnswering({ operator: 'SplitString', source: 's2', delimiter: ';', explanation: 'x' })
        const object = await other.inject({ method: 'POST', url: '/condition/loop', payload: loopRequest })
        expect(object.json()).toMatchObject({ operator: 'forin', source: 's2', delimiter: '' })
    })

    it('rejects a request without values to loop over', async () => {
        const { app } = await appAnswering({})
        const response = await app.inject({ method: 'POST', url: '/condition/loop', payload: { ...loopRequest, sources: [] } })
        expect(response.statusCode).toBe(400)
    })
})
