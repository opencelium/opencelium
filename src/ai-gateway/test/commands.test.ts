import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { commandText, createCommandIndex } from '../src/command/commandIndex.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import type { Embedder } from '../src/llm/ollamaEmbedder.ts'

const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }

const commands = [
    { id: 'list users', phrase: 'list users', description: 'Open the entry list' },
    { id: 'delete schedule by workflow.title <identifier>', phrase: 'delete schedule by workflow.title <identifier>', description: 'Delete an entry' },
    { id: 'theme dark', phrase: 'theme dark', description: 'Change the application theme' },
]

/** Vectors by keyword, so the ranking is predictable: each text points along the axes of the topics it mentions. */
const TOPICS = ['user', 'schedule', 'theme']
function topicEmbedder(): Embedder & { calls: string[][] } {
    const calls: string[][] = []
    return {
        calls,
        async embed(texts) {
            calls.push(texts)
            return texts.map((text) => TOPICS.map((topic) => (text.toLowerCase().includes(topic) ? 1 : 0)))
        },
    }
}

function llmAnswering(answer: object): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(request)
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 10 }
        },
        async listModels() { return [] },
    }
}

describe('command index', () => {
    it('embeds the typed words without the value placeholder', () => {
        expect(commandText(commands[1]!)).toBe('delete schedule by workflow title: Delete an entry')
    })

    it('ranks by meaning and embeds each command only once', async () => {
        const embedder = topicEmbedder()
        const index = createCommandIndex(embedder)
        expect((await index.rank('remove a schedule', commands, 5)).map((entry) => entry.id)).toEqual([commands[1]!.id])
        await index.rank('show the users', commands, 5)
        expect(embedder.calls[1]).toEqual(['show the users'])
    })

    it('falls back to shared words without an embedding model', async () => {
        const ranked = await createCommandIndex(undefined).rank('switch the theme', commands, 5)
        expect(ranked[0]?.id).toBe('theme dark')
    })
})

describe('POST /command/route', () => {
    it('offers the closest commands under short keys and returns the chosen one with its value', async () => {
        const llm = llmAnswering({ command: 'c1', argument: 'idoit sync', reply: 'Deletes the schedule.' })
        const app = await buildApp({ config: loadConfig({}), llm, invokers, embedder: topicEmbedder() })
        const response = await app.inject({
            method: 'POST', url: '/command/route', payload: { prompt: 'remove the idoit sync schedule', commands, page: '/schedule' },
        })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({ commandId: commands[1]!.id, argument: 'idoit sync', reply: 'Deletes the schedule.', model: 'qwen2.5-coder:7b' })
        const message = llm.requests[0]?.messages[0]?.content ?? ''
        expect(message).toContain('c1: delete schedule by workflow.title <identifier>: Delete an entry')
        expect(message).toContain('on the page /schedule')
    })

    it('drops a value for a command that takes none, and reports "none" as no command', async () => {
        const embedder = topicEmbedder()
        let app = await buildApp({ config: loadConfig({}), llm: llmAnswering({ command: 'c1', argument: 'x', reply: 'ok' }), invokers, embedder })
        let response = await app.inject({ method: 'POST', url: '/command/route', payload: { prompt: 'dark theme', commands } })
        expect(response.json()).toMatchObject({ commandId: 'theme dark', argument: '' })
        app = await buildApp({ config: loadConfig({}), llm: llmAnswering({ command: 'none', argument: '', reply: 'Not possible.' }), invokers, embedder })
        response = await app.inject({ method: 'POST', url: '/command/route', payload: { prompt: 'order a pizza', commands } })
        expect(response.json()).toMatchObject({ commandId: null, reply: 'Not possible.' })
    })

    it('rejects a request without commands', async () => {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering({}), invokers })
        const response = await app.inject({ method: 'POST', url: '/command/route', payload: { prompt: 'x', commands: [] } })
        expect(response.statusCode).toBe(400)
    })
})

describe('POST /command/search', () => {
    it('returns the matching commands with their scores', async () => {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering({}), invokers, embedder: topicEmbedder() })
        const response = await app.inject({ method: 'POST', url: '/command/search', payload: { query: 'users', commands } })
        expect(response.json().matches[0]).toMatchObject({ id: 'list users' })
    })
})

describe('reply language', () => {
    it('asks for the reply in the UI language', async () => {
        const llm = llmAnswering({ command: 'none', argument: '', reply: 'x' })
        const app = await buildApp({ config: loadConfig({}), llm, invokers, embedder: topicEmbedder() })
        await app.inject({ method: 'POST', url: '/command/route', payload: { prompt: 'users', commands, language: 'de' } })
        expect(llm.requests[0]?.messages[0]?.content).toContain('one short sentence in German')
    })
})
