export type ChatMessage = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export type ChatRequest = {
    model: string
    messages: ChatMessage[]
    /** JSON Schema the runtime enforces while decoding; absent for a plain-text answer. */
    format?: Record<string, unknown>
    contextTokens: number
    temperature: number
}

export type ChatResult = {
    content: string
    promptTokens: number
    outputTokens: number
    durationMs: number
}

export type LlmClient = {
    chat(request: ChatRequest): Promise<ChatResult>
    /** The answer's text as it is written; clients without streaming leave it out and callers fall back to `chat`. */
    stream?(request: ChatRequest): AsyncIterable<string>
    listModels(): Promise<string[]>
}
