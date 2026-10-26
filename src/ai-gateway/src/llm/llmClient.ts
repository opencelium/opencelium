export type ChatMessage = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export type ChatRequest = {
    model: string
    messages: ChatMessage[]
    /** JSON Schema the runtime enforces while decoding. */
    format: Record<string, unknown>
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
    listModels(): Promise<string[]>
}
