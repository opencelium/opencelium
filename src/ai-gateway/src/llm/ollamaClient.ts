import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { ChatRequest, ChatResult, LlmClient, RunningModel } from './llmClient.ts'
import type { LlmCallLog } from '../diagnostics/llmCallLog.ts'
import { currentRequestContext } from './requestContext.ts'

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
    load_duration?: number
    prompt_eval_duration?: number
    eval_duration?: number
}

type OllamaTagsResponse = {
    models?: { name: string }[]
}

type OllamaPsResponse = {
    models?: { name: string; size_vram?: number; expires_at?: string }[]
}

const nsToMs = (ns: number | undefined) => (ns === undefined ? null : Math.round(ns / 1e6))
const PS_TIMEOUT_MS = 1_000

const DEFAULT_CHAT_TIMEOUT_MS = 15 * 60_000
const TAGS_TIMEOUT_MS = 3_000

/** The answer's lines as they arrive, each parsed; an error Ollama sends in the stream is thrown. */
async function* chunks(body: AsyncIterable<string>): AsyncGenerator<OllamaChatChunk> {
    let buffer = ''
    const parse = (line: string) => {
        const chunk = JSON.parse(line) as OllamaChatChunk
        if (chunk.error) throw new Error(`Ollama chat failed: ${chunk.error}`)
        return chunk
    }
    for await (const part of body) {
        buffer += part
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) if (line.trim()) yield parse(line)
    }
    if (buffer.trim()) yield parse(buffer)
}

/**
 * `chatTimeoutMs` bounds one model answer, queueing included; a large plan-fixed build on a laptop GPU can take well
 * over five minutes. The answer is streamed so the time a request may take is the gateway's to decide, not a transport
 * default (see `httpPost`). It also stops as soon as the HTTP request it is for has gone (`requestContext`), so Ollama
 * does not keep working on an answer nobody waits for. With `calls`, every answer is measured.
 */
export function createOllamaClient(baseUrl: string, chatTimeoutMs = DEFAULT_CHAT_TIMEOUT_MS, post: StreamingPost = httpPost,
    calls?: LlmCallLog): LlmClient {
    const listRunning = async (): Promise<RunningModel[]> => {
        const response = await fetch(`${baseUrl}/api/ps`, { signal: AbortSignal.timeout(PS_TIMEOUT_MS) })
        if (!response.ok) throw new Error(`Ollama ps failed with HTTP ${response.status}`)
        const body = (await response.json()) as OllamaPsResponse
        return (body.models ?? []).map((model) => ({
            name: model.name, sizeVramBytes: model.size_vram ?? 0, expiresAt: model.expires_at ?? null }))
    }

    const isLoaded = async (model: string) => {
        if (!calls) return null
        const running = await listRunning().catch(() => null)
        return running ? running.some((loaded) => loaded.name === model || loaded.name === `${model}:latest`) : null
    }

    /** The answer's lines, measured: the call is recorded once, however it ends. */
    async function* answer(request: ChatRequest): AsyncGenerator<OllamaChatChunk> {
        const context = currentRequestContext()
        const timeout = AbortSignal.timeout(chatTimeoutMs)
        const signal = context ? AbortSignal.any([timeout, context.signal]) : timeout
        const end = calls?.begin({ route: context?.route ?? null, model: request.model, wasLoaded: await isLoaded(request.model) })
        const startedAt = performance.now()
        let firstTokenMs: number | null = null
        let last: OllamaChatChunk = {}
        let isDone = false
        try {
            const body = JSON.stringify({
                model: request.model,
                stream: true,
                // Newer models (Qwen3 and later) reason before answering by default, which multiplies answer time and
                // breaks schema-constrained output; models without a thinking mode accept and ignore this.
                think: false,
                format: request.format,
                messages: request.messages,
                options: { temperature: request.temperature, num_ctx: request.contextTokens },
            })
            const response = await post(`${baseUrl}/api/chat`, body, signal)
            if (response.status < 200 || response.status >= 300) {
                let text = ''
                for await (const part of response.body) text += part
                throw new Error(`Ollama chat failed with HTTP ${response.status}: ${text}`)
            }
            for await (const chunk of chunks(response.body)) {
                if (firstTokenMs === null && chunk.message?.content) firstTokenMs = Math.round(performance.now() - startedAt)
                last = chunk
                yield chunk
            }
            isDone = true
        } finally {
            // Also reached when the reader stops early (a streamed answer whose caller left), with no error to look at.
            const outcome = isDone ? 'done' : timeout.aborted ? 'timeout' : context?.signal.aborted ? 'aborted' : 'error'
            const promptMs = nsToMs(last.prompt_eval_duration)
            end?.({
                outcome,
                wallMs: Math.round(performance.now() - startedAt),
                firstTokenMs,
                waitMs: firstTokenMs === null ? null : Math.max(0, firstTokenMs - (promptMs ?? 0)),
                loadMs: nsToMs(last.load_duration),
                promptTokens: last.prompt_eval_count ?? null,
                promptMs,
                outputTokens: last.eval_count ?? null,
                outputMs: nsToMs(last.eval_duration),
            })
        }
    }

    return {
        async chat(request: ChatRequest): Promise<ChatResult> {
            let content = ''
            let last: OllamaChatChunk = {}
            for await (const chunk of answer(request)) {
                content += chunk.message?.content ?? ''
                last = chunk
            }
            return {
                content,
                promptTokens: last.prompt_eval_count ?? 0,
                outputTokens: last.eval_count ?? 0,
                durationMs: Math.round((last.total_duration ?? 0) / 1e6),
            }
        },

        async *stream(request: ChatRequest): AsyncIterable<string> {
            for await (const chunk of answer(request)) {
                if (chunk.message?.content) yield chunk.message.content
            }
        },

        async listModels(): Promise<string[]> {
            const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(TAGS_TIMEOUT_MS) })
            if (!response.ok) throw new Error(`Ollama tags failed with HTTP ${response.status}`)
            const body = (await response.json()) as OllamaTagsResponse
            return (body.models ?? []).map((model) => model.name)
        },

        listRunning,
    }
}
