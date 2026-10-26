import type { ChatRequest, ChatResult, LlmClient } from './llmClient.ts'

type OllamaChatResponse = {
    message?: { content?: string }
    prompt_eval_count?: number
    eval_count?: number
    total_duration?: number
}

type OllamaTagsResponse = {
    models?: { name: string }[]
}

const CHAT_TIMEOUT_MS = 5 * 60_000
const TAGS_TIMEOUT_MS = 3_000

export function createOllamaClient(baseUrl: string): LlmClient {
    return {
        async chat(request: ChatRequest): Promise<ChatResult> {
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
                body: JSON.stringify({
                    model: request.model,
                    stream: false,
                    format: request.format,
                    messages: request.messages,
                    options: { temperature: request.temperature, num_ctx: request.contextTokens },
                }),
            })
            if (!response.ok) {
                throw new Error(`Ollama chat failed with HTTP ${response.status}: ${await response.text()}`)
            }
            const body = (await response.json()) as OllamaChatResponse
            return {
                content: body.message?.content ?? '',
                promptTokens: body.prompt_eval_count ?? 0,
                outputTokens: body.eval_count ?? 0,
                durationMs: Math.round((body.total_duration ?? 0) / 1e6),
            }
        },

        async listModels(): Promise<string[]> {
            const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(TAGS_TIMEOUT_MS) })
            if (!response.ok) throw new Error(`Ollama tags failed with HTTP ${response.status}`)
            const body = (await response.json()) as OllamaTagsResponse
            return (body.models ?? []).map((model) => model.name)
        },
    }
}
