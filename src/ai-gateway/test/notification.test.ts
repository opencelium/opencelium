import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const request = {
    language: 'de', type: 'email', templateName: 'Sync failed',
    instruction: 'Tell the CMDB team that the nightly sync failed and how many records were affected',
    placeholders: [{ token: '{{SyncStats.failedCount}}', description: 'records that failed' }],
}

const appAnswering = async (...answers: object[]) => {
    const requests: ChatRequest[] = []
    const llm: LlmClient = {
        async chat(chat) {
            requests.push(chat)
            const answer = answers[Math.min(requests.length - 1, answers.length - 1)]
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 3 }
        },
        async listModels() { return [] },
    }
    const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
    return { app: await buildApp({ config: loadConfig({}), llm, invokers }), requests }
}

describe('POST /notification/draft', () => {
    it('tells the model the placeholders and returns a text that uses only them', async () => {
        const good = { subject: 'Sync fehlgeschlagen', body: 'Hallo,\n{{SyncStats.failedCount}} Datensätze sind fehlgeschlagen.' }
        const { app, requests } = await appAnswering(good)
        const response = await app.inject({ method: 'POST', url: '/notification/draft', payload: request })
        expect(response.json()).toMatchObject({ ...good, removedPlaceholders: [] })
        const told = requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('- {{SyncStats.failedCount}}: records that failed')
        expect(told).toContain('- {SCHEDULER_TITLE}: title of the schedule')
        expect(told).toContain('filled only for "post" notifications')
        expect(told).toContain('sent via email')
        expect(told).toContain('Write it in German.')
        expect(requests).toHaveLength(1)
    })

    it('sends invented placeholders back once, then removes the ones still there', async () => {
        const invented = { subject: 'Sync {{schedule.name}} fehlgeschlagen', body: '{{SyncStats.failedCount}} Fehler in {SCHEDULER_TITLE} um {{run.time}} {RUN_TIME}.' }
        const { app, requests } = await appAnswering(invented)
        const response = await app.inject({ method: 'POST', url: '/notification/draft', payload: request })
        expect(requests).toHaveLength(2)
        expect(requests[1]?.messages.at(-1)?.content).toContain('These placeholders do not exist: {{schedule.name}}, {{run.time}}, {RUN_TIME}')
        expect(response.json()).toMatchObject({ subject: 'Sync fehlgeschlagen', body: '{{SyncStats.failedCount}} Fehler in {SCHEDULER_TITLE} um .',
            removedPlaceholders: ['{{schedule.name}}', '{{run.time}}', '{RUN_TIME}'] })
    })

    it('needs an instruction', async () => {
        const { app } = await appAnswering({})
        expect((await app.inject({ method: 'POST', url: '/notification/draft', payload: { ...request, instruction: ' ' } })).statusCode).toBe(400)
    })
})
