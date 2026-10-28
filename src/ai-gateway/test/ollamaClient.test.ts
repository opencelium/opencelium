import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { type StreamingPost, createOllamaClient, httpPost } from '../src/llm/ollamaClient.ts'

async function* pieces(text: string, size: number) {
    for (let at = 0; at < text.length; at += size) yield text.slice(at, at + size)
}

const request = { model: 'm', messages: [], format: {}, contextTokens: 1024, temperature: 0 }

describe('createOllamaClient', () => {
    it('asks for a streamed answer and joins its lines, split anywhere, into content and counts', async () => {
        const lines = [
            { message: { content: '{"ok":' } },
            { message: { content: 'true}' } },
            { done: true, prompt_eval_count: 12, eval_count: 3, total_duration: 2_000_000 },
        ].map((line) => JSON.stringify(line)).join('\n')
        const sent: string[] = []
        const post: StreamingPost = async (_url, body) => {
            sent.push(body)
            return { status: 200, body: pieces(lines, 7) }
        }
        const result = await createOllamaClient('http://ollama', 1000, post).chat(request)
        expect(result).toEqual({ content: '{"ok":true}', promptTokens: 12, outputTokens: 3, durationMs: 2 })
        expect(JSON.parse(sent[0]!).stream).toBe(true)
    })

    it('reports an error Ollama sends in the stream or as a failed status', async () => {
        const inStream: StreamingPost = async () => ({ status: 200, body: pieces('{"error":"model not found"}\n', 64) })
        await expect(createOllamaClient('http://ollama', 1000, inStream).chat(request)).rejects.toThrow('model not found')
        const failed: StreamingPost = async () => ({ status: 500, body: pieces('overloaded', 64) })
        await expect(createOllamaClient('http://ollama', 1000, failed).chat(request)).rejects.toThrow('HTTP 500: overloaded')
    })
})

describe('httpPost', () => {
    it('waits for a response that starts late instead of giving up', async () => {
        const server = createServer((incoming, response) => {
            let body = ''
            incoming.on('data', (part) => { body += part })
            incoming.on('end', () => setTimeout(() => response.end(`echo ${body}`), 50))
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        const { port } = server.address() as AddressInfo
        const response = await httpPost(`http://127.0.0.1:${port}/api/chat`, 'hi', AbortSignal.timeout(5000))
        let text = ''
        for await (const part of response.body) text += part
        server.close()
        expect({ status: response.status, text }).toEqual({ status: 200, text: 'echo hi' })
    })
})
