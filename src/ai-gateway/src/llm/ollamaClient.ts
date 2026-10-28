import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { ChatRequest, ChatResult, LlmClient } from './llmClient.ts'

/** A POST whose answer arrives as text pieces; `status` is known once the response starts. */
export type StreamingPost = (url: string, body: string, signal: AbortSignal) => Promise<{ status: number; body: AsyncIterable<string> }>

/**
 * POST over node:http rather than fetch: fetch gives up after five minutes without response headers, and Ollama runs
 * one answer at a time, so a request queued behind a long one waits longer than that before its first byte.
 */
export const httpPost: StreamingPost = (url, body, signal) => new Promise((resolve, reject) => {
    const send = url.startsWith('https:') ? httpsRequest : httpRequest
    const request = send(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal }, (response) => {
        response.setEncoding('utf8')
        resolve({ status: response.statusCode ?? 0, body: response })
    })
    request.on('error', reject)
    request.end(body)
})

/** One line of a streamed answer; the last one (`done`) carries the counts. */
type OllamaChatChunk = {
    message?: { content?: string }
    done?: boolean
    error?: string
    prompt_eval_count?: number
    eval_count?: number
    total_duration?: number
}

type OllamaTagsResponse = {
    models?: { name: string }[]
}

const DEFAULT_CHAT_TIMEOUT_MS = 15 * 60_000
const TAGS_TIMEOUT_MS = 3_000

/** Joins a streamed answer (one JSON object per line) into the content and the final counts. */
async function readStream(body: AsyncIterable<string>): Promise<ChatResult> {
    let content = ''
    let last: OllamaChatChunk = {}
    let buffer = ''
    const take = (line: string) => {
        if (!line.trim()) return
        const chunk = JSON.parse(line) as OllamaChatChunk
        if (chunk.error) throw new Error(`Ollama chat failed: ${chunk.error}`)
        content += chunk.message?.content ?? ''
        last = chunk
    }
    for await (const part of body) {
        buffer += part
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        lines.forEach(take)
    }
    take(buffer)
    return {
        content,
        promptTokens: last.prompt_eval_count ?? 0,
        outputTokens: last.eval_count ?? 0,
        durationMs: Math.round((last.total_duration ?? 0) / 1e6),
    }
}

/**
 * `chatTimeoutMs` bounds one model answer, queueing included; a large plan-fixed build on a laptop GPU can take well
 * over five minutes. The answer is streamed so the time a request may take is the gateway's to decide, not a transport
 * default (see `httpPost`).
 */
export function createOllamaClient(baseUrl: string, chatTimeoutMs = DEFAULT_CHAT_TIMEOUT_MS, post: StreamingPost = httpPost): LlmClient {
    return {
        async chat(request: ChatRequest): Promise<ChatResult> {
            const body = JSON.stringify({
                model: request.model,
                stream: true,
                format: request.format,
                messages: request.messages,
                options: { temperature: request.temperature, num_ctx: request.contextTokens },
            })
            const response = await post(`${baseUrl}/api/chat`, body, AbortSignal.timeout(chatTimeoutMs))
            if (response.status < 200 || response.status >= 300) {
                let text = ''
                for await (const part of response.body) text += part
                throw new Error(`Ollama chat failed with HTTP ${response.status}: ${text}`)
            }
            return readStream(response.body)
        },

        async listModels(): Promise<string[]> {
            const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(TAGS_TIMEOUT_MS) })
            if (!response.ok) throw new Error(`Ollama tags failed with HTTP ${response.status}`)
            const body = (await response.json()) as OllamaTagsResponse
            return (body.models ?? []).map((model) => model.name)
        },
    }
}
