import type { GatewayConfig } from '../config.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { LlmCallLog } from '../diagnostics/llmCallLog.ts'
import { createOllamaClient } from '../llm/ollamaClient.ts'
import { createOllamaEmbedder, type Embedder } from '../llm/ollamaEmbedder.ts'
import { createWhisperClient, type SpeechClient } from '../speech/speechClient.ts'

/** A client rebuilt whenever the settings it was built from change, so a URL saved on the AI settings page counts at once. */
function rebuiltOn<TKey, TClient>(key: () => TKey, build: (key: TKey) => TClient): () => TClient {
    let builtFor: string | undefined
    let client: TClient | undefined
    return () => {
        const current = key()
        const signature = JSON.stringify(current)
        if (client === undefined || signature !== builtFor) {
            client = build(current)
            builtFor = signature
        }
        return client
    }
}

export function createLiveLlmClient(config: GatewayConfig, calls?: LlmCallLog): LlmClient {
    const client = rebuiltOn(() => ({ url: config.ollamaUrl, timeout: config.chatTimeoutMs }),
        ({ url, timeout }) => createOllamaClient(url, timeout, undefined, calls))
    return {
        chat: (request) => client().chat(request),
        stream: (request) => {
            const current = client()
            if (!current.stream) throw new Error('This model client cannot stream')
            return current.stream(request)
        },
        listModels: () => client().listModels(),
        listRunning: () => client().listRunning?.() ?? Promise.resolve([]),
    }
}

/** The embedding model itself is not live: changing it would need every template and docs page embedded again. */
export function createLiveEmbedder(config: GatewayConfig): Embedder {
    const embedder = rebuiltOn(() => config.ollamaUrl, (url) => createOllamaEmbedder(url, config.embedModel))
    return { embed: (texts) => embedder().embed(texts) }
}

/** Speech to text that follows the saved URL; an empty URL means it is off. */
export function createLiveSpeechClient(config: GatewayConfig): SpeechClient {
    const speech = rebuiltOn(() => config.speechUrl, (url) => (url ? createWhisperClient(url) : null))
    return {
        transcribe: (wav, prompt, language) => {
            const current = speech()
            if (!current) return Promise.reject(new Error('No speech service is configured'))
            return current.transcribe(wav, prompt, language)
        },
        isReachable: async () => speech()?.isReachable() ?? false,
    }
}
