import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import { buildSpeechPrompt, cleanTranscript } from '../speech/speechVocabulary.ts'
import { sendApiError } from './apiError.ts'

// About 30 s of 16 kHz mono 16-bit audio: far more than a spoken command needs.
const MAX_AUDIO_BYTES = 1_000_000

export function registerSpeechRoutes(app: FastifyInstance, { speech, invokers }: AppDeps) {
    let prompt: Promise<string> | undefined
    const promptFor = () => (prompt ??= invokers.list().then((list) => buildSpeechPrompt(list.map((invoker) => invoker.name))))

    app.addContentTypeParser('audio/wav', { parseAs: 'buffer', bodyLimit: MAX_AUDIO_BYTES }, (_request, body, done) => done(null, body))

    app.post('/speech/transcribe', async (request, reply) => {
        if (!speech) return sendApiError(reply, 'SPEECH_UNAVAILABLE', 'No speech service is configured')
        if (!Buffer.isBuffer(request.body) || request.body.length < 44) return sendApiError(reply, 'BAD_REQUEST', 'Send a WAV file as audio/wav')
        const started = Date.now()
        try {
            const transcript = await speech.transcribe(request.body, await promptFor())
            const text = cleanTranscript(transcript.text)
            request.log.info({ bytes: request.body.length, language: transcript.language, durationMs: Date.now() - started }, 'speech transcribed')
            return { text, language: transcript.language ?? null, durationMs: Date.now() - started }
        } catch (error) {
            request.log.error({ err: error }, 'speech transcription failed')
            return sendApiError(reply, 'SPEECH_UNAVAILABLE', error instanceof Error ? error.message : 'Transcription failed')
        }
    })
}
