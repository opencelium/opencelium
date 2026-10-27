export type Transcript = { text: string; language?: string }

export type SpeechClient = {
    transcribe(wav: Buffer, prompt: string): Promise<Transcript>
    isReachable(): Promise<boolean>
}

const TRANSCRIBE_TIMEOUT_MS = 60_000
const PROBE_TIMEOUT_MS = 2_000

/** whisper.cpp's `whisper-server`: one 16 kHz mono WAV in, its text out. */
export function createWhisperClient(baseUrl: string): SpeechClient {
    return {
        async transcribe(wav, prompt) {
            const form = new FormData()
            form.append('file', new Blob([new Uint8Array(wav)], { type: 'audio/wav' }), 'speech.wav')
            form.append('response_format', 'verbose_json')
            form.append('temperature', '0')
            if (prompt) form.append('prompt', prompt)
            const response = await fetch(`${baseUrl}/inference`, { method: 'POST', body: form, signal: AbortSignal.timeout(TRANSCRIBE_TIMEOUT_MS) })
            if (!response.ok) throw new Error(`whisper-server failed with HTTP ${response.status}: ${await response.text()}`)
            const body = (await response.json()) as { text?: unknown; language?: unknown; error?: unknown }
            if (typeof body.text !== 'string') throw new Error(typeof body.error === 'string' ? body.error : 'whisper-server returned no text')
            return { text: body.text, language: typeof body.language === 'string' ? body.language : undefined }
        },
        async isReachable() {
            try {
                await fetch(baseUrl, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) })
                return true
            } catch {
                return false
            }
        },
    }
}
