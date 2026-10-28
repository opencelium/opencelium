import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const appAnswering = async (answer: object) => {
    const requests: ChatRequest[] = []
    const llm: LlmClient = {
        async chat(request) {
            requests.push(request)
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 6 }
        },
        async listModels() { return [] },
    }
    const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
    return { app: await buildApp({ config: loadConfig({}), llm, invokers }), requests }
}

describe('POST /workflow/explain', () => {
    it('sends the outline in the asked language and returns description and explanation', async () => {
        const { app, requests } = await appAnswering({ description: ' Liest Hosts aus Zabbix. ', explanation: ['Hosts lesen'] })
        const response = await app.inject({ method: 'POST', url: '/workflow/explain',
            payload: { language: 'de', title: 'Hosts', outline: 'Get hosts — host.get on Zabbix' } })
        expect(response.json()).toMatchObject({ description: 'Liest Hosts aus Zabbix.', explanation: ['Hosts lesen'] })
        const told = requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('Workflow "Hosts":\nGet hosts — host.get on Zabbix')
        expect(told).toContain('Answer in German.')
    })

    it('rejects an empty outline', async () => {
        const { app } = await appAnswering({})
        expect((await app.inject({ method: 'POST', url: '/workflow/explain', payload: { outline: ' ' } })).statusCode).toBe(400)
    })
})
