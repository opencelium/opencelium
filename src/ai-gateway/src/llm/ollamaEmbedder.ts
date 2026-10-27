export type Embedder = {
    embed(texts: string[]): Promise<number[][]>
}

const EMBED_TIMEOUT_MS = 60_000

/** Ollama's /api/embed: one vector per input text, from a local embedding model. */
export function createOllamaEmbedder(baseUrl: string, model: string): Embedder {
    return {
        async embed(texts) {
            const response = await fetch(`${baseUrl}/api/embed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
                body: JSON.stringify({ model, input: texts }),
            })
            if (!response.ok) throw new Error(`Ollama embed failed with HTTP ${response.status}: ${await response.text()}`)
            const body = (await response.json()) as { embeddings?: number[][] }
            if (!body.embeddings || body.embeddings.length !== texts.length) throw new Error('Ollama returned no embeddings')
            return body.embeddings
        },
    }
}
