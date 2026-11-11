import { request as httpRequest } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { createLlmCallLog, type LlmCallStats } from '../src/diagnostics/llmCallLog.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { LlmClient } from '../src/llm/llmClient.ts'
import { type StreamingPost, createOllamaClient } from '../src/llm/ollamaClient.ts'
import { currentRequestContext, runInRequestContext } from '../src/llm/requestContext.ts'
import { summarizeCalls } from '../src/routes/diagnostics.ts'

const request = { model: 'm', messages: [], format: {}, contextTokens: 1024, temperature: 0 }
const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }

async function* lines(items: object[]) {
    for (const item of items) yield `${JSON.stringify(item)}\n`
}

describe('model call measurements', () => {
    it('records the wait, Ollama\'s timings and the outcome of each call', async () => {
        const recorded: LlmCallStats[] = []
        const post: StreamingPost = async () => ({ status: 200, body: lines([
            { message: { content: 'hi' } },
            { done: true, prompt_eval_count: 40, prompt_eval_duration: 5e6, eval_count: 2, eval_duration: 9e6, load_duration: 3e6 },
        ]) })
        const client = createOllamaClient('http://127.0.0.1:1', 1000, post, createLlmCallLog((stats) => recorded.push(stats)))
        await runInRequestContext({ route: '/mapping/suggest', signal: new AbortController().signal }, () => client.chat(request))
        expect(recorded).toEqual([expect.objectContaining({ route: '/mapping/suggest', model: 'm', outcome: 'done', inFlightBefore: 0,
            promptTokens: 40, promptMs: 5, outputTokens: 2, outputMs: 9, loadMs: 3 })])
    })

    it('stops the call to Ollama once its caller has gone, and records it as aborted', async () => {
        const recorded: LlmCallStats[] = []
        const caller = new AbortController()
        let sentSignal: AbortSignal | undefined
        const post: StreamingPost = (_url, _body, signal) => {
            sentSignal = signal
            return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
        }
        const client = createOllamaClient('http://127.0.0.1:1', 60_000, post, createLlmCallLog((stats) => recorded.push(stats)))
        const answer = runInRequestContext({ route: '/workflow/generate', signal: caller.signal }, () => client.chat(request))
        await new Promise((resolve) => setTimeout(resolve, 10))
        caller.abort()
        await expect(answer).rejects.toBeDefined()
        expect(sentSignal?.aborted).toBe(true)
        expect(recorded[0]).toMatchObject({ outcome: 'aborted', route: '/workflow/generate' })
    })

    it('counts the calls already running and sums them up per model', () => {
        const log = createLlmCallLog()
        const endFirst = log.begin({ route: '/a', model: 'big', wasLoaded: false })
        const endSecond = log.begin({ route: '/b', model: 'big', wasLoaded: true })
        const ended = { wallMs: 10, firstTokenMs: 5, waitMs: 4, loadMs: null, promptTokens: null, promptMs: null, outputTokens: null, outputMs: null }
        endSecond({ outcome: 'done', ...ended })
        endFirst({ outcome: 'aborted', ...ended })
        expect(log.inFlight()).toBe(0)
        expect(summarizeCalls(log.recent())).toEqual([expect.objectContaining({ model: 'big', calls: 2, concurrent: 1, coldStarts: 1,
            outcomes: { done: 1, aborted: 1, timeout: 0, error: 0 } })])
    })
})

describe('request context in the gateway', () => {
    it('gives a route\'s model call a signal that fires when the browser disconnects', async () => {
        const llm: LlmClient = { chat: async () => ({ content: '', promptTokens: 0, outputTokens: 0, durationMs: 0 }), listModels: async () => [] }
        const app = await buildApp({ config: loadConfig({}), llm, invokers })
        let aborted: Promise<string> | undefined
        app.get('/test/wait', async () => {
            const context = currentRequestContext()
            aborted = new Promise((resolve) => context?.signal.addEventListener('abort', () => resolve(context.route)))
            await new Promise((resolve) => setTimeout(resolve, 2_000))
            return {}
        })
        await app.listen({ port: 0, host: '127.0.0.1' })
        const { port } = app.server.address() as AddressInfo
        const browser = httpRequest({ host: '127.0.0.1', port, path: '/test/wait' })
        browser.on('error', () => {})
        browser.end()
        await new Promise((resolve) => setTimeout(resolve, 100))
        browser.destroy()
        await expect(aborted).resolves.toBe('/test/wait')
        await app.close()
    })
})
