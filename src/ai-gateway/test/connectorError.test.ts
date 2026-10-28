import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { classifyConnectorError } from '../src/connectorError/classifyConnectorError.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { tracker } from './fixtures.ts'

describe('classifyConnectorError', () => {
    it('tells look-alike failures apart by their error text', () => {
        const kind = (error: string, status = 'DOWN') => classifyConnectorError(error, status).kind
        expect(kind('java.net.UnknownHostException: otrs.intern')).toBe('unknownHost')
        expect(kind('Connection refused (Connection refused)')).toBe('refused')
        expect(kind('Read timed out')).toBe('timeout')
        expect(kind('PKIX path building failed: unable to find valid certification path')).toBe('certificate')
        expect(kind('{"status":401,"error":"Unauthorized"}', 'AUTH_FAILED')).toBe('unauthorized')
        expect(kind('403 Forbidden')).toBe('forbidden')
        expect(kind('404 Not Found')).toBe('notFound')
        expect(kind('', 'AUTH_FAILED')).toBe('unauthorized')
        expect(kind('something odd')).toBe('unknown')
    })
})

describe('POST /connector/explain-error', () => {
    const answer = { summary: 'Host unbekannt', cause: 'Tippfehler in url', checks: ['url prüfen'], fixIn: 'connector' }
    const appWith = async () => {
        const requests: ChatRequest[] = []
        const llm: LlmClient = {
            async chat(request) {
                requests.push(request)
                return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 5 }
            },
            async listModels() { return [] },
        }
        const invokers: InvokerRepository = { list: async () => [], get: async (name) => (name === 'Tracker' ? tracker : undefined) }
        return { app: await buildApp({ config: loadConfig({}), llm, invokers }), requests }
    }

    it('tells the model the classified error and how the invoker connects, and returns the kind', async () => {
        const { app, requests } = await appWith()
        const response = await app.inject({ method: 'POST', url: '/connector/explain-error',
            payload: { language: 'de', connector: 'Tracker prod', invoker: 'Tracker', status: 'DOWN', error: 'java.net.UnknownHostException: tracker.intern' } })
        expect(response.json()).toMatchObject({ ...answer, kind: 'unknownHost' })
        const told = requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('Detected: the host name in the URL could not be resolved')
        expect(told).toContain('Settings: url (default "https://example.test"), token')
        expect(told).toContain('Test call: GET {url}/ping')
        expect(told).toContain('Answer in German.')
    })

    it('rejects an unknown status', async () => {
        const { app } = await appWith()
        expect((await app.inject({ method: 'POST', url: '/connector/explain-error', payload: { status: 'BROKEN' } })).statusCode).toBe(400)
    })
})
