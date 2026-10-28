import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const request = {
    language: 'de',
    target: { step: 'Create config item', operation: 'ConfigItemCreate', system: 'OTRS', fields: [
        { path: 'ConfigItem.Name', current: '' },
        { path: 'ConfigItem.Class', current: 'Computer' },
        { path: 'ConfigItem.DeplState', current: '' },
    ] },
    sources: [
        { id: 's1', step: 'Get hosts', system: 'Zabbix', path: 'result[i].host' },
        { id: 's2', step: 'Get hosts', system: 'Zabbix', path: 'result[i].hostid' },
    ],
}

function appAnswering(answer: object) {
    const requests: ChatRequest[] = []
    const llm: LlmClient = {
        async chat(chat) {
            requests.push(chat)
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 4 }
        },
        async listModels() { return [] },
    }
    const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
    return { app: buildApp({ config: loadConfig({}), llm, invokers }), requests }
}

describe('POST /mapping/suggest', () => {
    it('keeps real suggestions and drops none, repeats and fields that are already set', async () => {
        const { app, requests } = appAnswering({ suggestions: [
            { field: 'ConfigItem.Name', source: 's1', reason: 'gleiche Bedeutung' },
            { field: 'ConfigItem.Name', source: 's2', reason: 'zweiter Versuch' },
            { field: 'ConfigItem.Class', source: 's2', reason: 'überschreibt' },
            { field: 'ConfigItem.DeplState', source: 'none', reason: '' },
        ] })
        const response = await (await app).inject({ method: 'POST', url: '/mapping/suggest', payload: request })
        expect(response.json().suggestions).toEqual([{ field: 'ConfigItem.Name', source: 's1', reason: 'gleiche Bedeutung' }])
        const told = requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('- ConfigItem.Class (already set: Computer)')
        expect(told).toContain('- s1: Get hosts (Zabbix) › result[i].host')
        expect(told).toContain('in German')
    })

    it('lets the model choose only this step\'s fields and the given sources', async () => {
        const { app, requests } = appAnswering({ suggestions: [] })
        await (await app).inject({ method: 'POST', url: '/mapping/suggest', payload: request })
        const schema = JSON.stringify(requests[0]?.format)
        expect(schema).toContain('"enum":["none","s1","s2"]')
        expect(schema).toContain('"enum":["ConfigItem.Name","ConfigItem.Class","ConfigItem.DeplState"]')
    })

    it('rejects a request without sources', async () => {
        const { app } = appAnswering({ suggestions: [] })
        const response = await (await app).inject({ method: 'POST', url: '/mapping/suggest', payload: { ...request, sources: [] } })
        expect(response.statusCode).toBe(400)
    })
})
