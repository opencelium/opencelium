import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { buildSpeechPrompt, cleanTranscript } from '../speech/speechVocabulary.ts'
import { sendApiError } from './apiError.ts'

// About 30 s of 16 kHz mono 16-bit audio: far more than a spoken command needs.
const MAX_AUDIO_BYTES = 1_000_000

// Words the caller expects to hear, e.g. the voice assistant's wake word and the open workflow's methods; capped so the
// system names still fit the ~224 tokens whisper keeps.
const querySchema = z.object({
    vocabulary: z.string().trim().max(300).optional(),
    /** Set when the user chose a speech language; whisper detects it otherwise. */
    language: z.enum(['en', 'de']).optional(),
})

/** Whisper weighs the end of its prompt most, so the caller's words go last. */
export const withVocabulary = (prompt: string, vocabulary?: string) => (vocabulary ? `${prompt} ${vocabulary}.` : prompt)

export function registerSpeechRoutes(app: FastifyInstance, { speech, invokers }: AppDeps) {
    let prompt: Promise<string> | undefined
    const promptFor = () => (prompt ??= invokers.list().then((list) => buildSpeechPrompt(list.map((invoker) => invoker.name))))

    app.addContentTypeParser('audio/wav', { parseAs: 'buffer', bodyLimit: MAX_AUDIO_BYTES }, (_request, body, done) => done(null, body))

    app.post('/speech/transcribe', async (request, reply) => {
        if (!speech) return sendApiError(reply, 'SPEECH_UNAVAILABLE', 'No speech service is configured')
        if (!Buffer.isBuffer(request.body) || request.body.length < 44) return sendApiError(reply, 'BAD_REQUEST', 'Send a WAV file as audio/wav')
        const query = querySchema.safeParse(request.query)
        if (!query.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid query', z.treeifyError(query.error))
        const started = Date.now()
        try {
            const transcript = await speech.transcribe(request.body, withVocabulary(await promptFor(), query.data.vocabulary), query.data.language)
            const text = cleanTranscript(transcript.text)
            request.log.info({ bytes: request.body.length, language: transcript.language, durationMs: Date.now() - started }, 'speech transcribed')
            return { text, language: transcript.language ?? null, durationMs: Date.now() - started }
        } catch (error) {
            request.log.error({ err: error }, 'speech transcription failed')
            return sendApiError(reply, 'SPEECH_UNAVAILABLE', error instanceof Error ? error.message : 'Transcription failed')
        }
    })
}
