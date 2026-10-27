import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }

function llmAnswering(answers: string[]): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(request)
            return { content: answers[requests.length - 1] ?? answers.at(-1) ?? '', promptTokens: 1, outputTokens: 1, durationMs: 10 }
        },
        async listModels() { return [] },
    }
}

const body = {
    prompt: 'Operational when the status is "in operation", otherwise Incident',
    target: 'body.$.ConfigItem.InciState',
    inputs: [{ name: 'VAR_0', source: 'cmdb.objects.read › response body.$.result[i].cmdb_status_title', sample: '"in operation"' }],
    currentScript: 'RESULT_VAR = VAR_0;',
}
const good = JSON.stringify({ code: "RESULT_VAR = VAR_0 == 'in operation' ? 'Operational' : 'Incident';", description: 'Map the status' })
const examples = { find: async () => [{ target: 'ConfigItem.InciState', inputs: ['result[i].cmdb_status_title'], code: 'RESULT_VAR = 1;' }] }

describe('POST /script/generate', () => {
    it('returns the script, telling the model the inputs, samples, current script and similar examples', async () => {
        const llm = llmAnswering([good])
        const app = await buildApp({ config: loadConfig({}), llm, invokers, examples })
        const response = await app.inject({ method: 'POST', url: '/script/generate', payload: body })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({ description: 'Map the status', problems: [] })
        const message = llm.requests[0]?.messages[0]?.content ?? ''
        expect(message).toContain('- VAR_0: cmdb.objects.read › response body.$.result[i].cmdb_status_title\n  example value: "in operation"')
        expect(message).toContain('Current script (change it as asked')
        expect(message).toContain('Example for ConfigItem.InciState')
    })

    it('asks once more when the script breaks the rules, and reports what is still wrong', async () => {
        const bad = JSON.stringify({ code: 'let x = VAR_1;', description: 'x' })
        const llm = llmAnswering([bad, bad])
        const app = await buildApp({ config: loadConfig({}), llm, invokers })
        const response = await app.inject({ method: 'POST', url: '/script/generate', payload: body })
        expect(llm.requests).toHaveLength(2)
        expect(response.json().problems.join(' ')).toMatch(/ECMAScript 5\.1.*never assigns RESULT_VAR.*VAR_1/s)
    })

    it('rejects a request without a prompt', async () => {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering([good]), invokers })
        const response = await app.inject({ method: 'POST', url: '/script/generate', payload: { ...body, prompt: ' ' } })
        expect(response.statusCode).toBe(400)
    })
})
