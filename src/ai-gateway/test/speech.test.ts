import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { LlmClient } from '../src/llm/llmClient.ts'
import type { SpeechClient } from '../src/speech/speechClient.ts'
import { buildSpeechPrompt, cleanTranscript } from '../src/speech/speechVocabulary.ts'

const invokers = {
    list: async () => [{ name: 'i-doit' }, { name: 'CheckMK 2' }, { name: 'CheckMK' }, { name: 'SnipeIT7' }],
    get: async () => undefined,
} as unknown as InvokerRepository
const llm: LlmClient = { chat: async () => { throw new Error('unused') }, listModels: async () => [] }
const wav = Buffer.alloc(2000)

function speechAnswering(text: string): SpeechClient & { prompts: string[] } {
    const prompts: string[] = []
    return { prompts, async transcribe(_wav, prompt) { prompts.push(prompt); return { text, language: 'de' } }, isReachable: async () => true }
}

describe('speech vocabulary', () => {
    it('names each system once, without version numbers, after the palette words', () => {
        const prompt = buildSpeechPrompt(['i-doit', 'CheckMK 2', 'CheckMK', 'SnipeIT7', 'WhatsUp 2024'])
        expect(prompt).toMatch(/^OpenCelium, workflow, schedule.*Zeitplan.*\. Systems: i-doit, CheckMK, SnipeIT, WhatsUp\.$/)
    })

    it('stays short enough for whisper to keep it', () => {
        expect(buildSpeechPrompt(Array.from({ length: 300 }, (_, index) => `System${index}x`)).length).toBeLessThanOrEqual(700)
    })

    it('turns a transcript into command text', () => {
        expect(cleanTranscript(' Show me all users.\n')).toBe('Show me all users')
        expect(cleanTranscript(' [BLANK_AUDIO]\n')).toBe('')
    })
})

describe('POST /speech/transcribe', () => {
    it('transcribes WAV audio with the system names as vocabulary', async () => {
        const speech = speechAnswering(' Lösche den Zeitplan für i-doit.\n')
        const app = await buildApp({ config: loadConfig({}), llm, invokers, speech })
        const response = await app.inject({ method: 'POST', url: '/speech/transcribe', headers: { 'content-type': 'audio/wav' }, payload: wav })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({ text: 'Lösche den Zeitplan für i-doit', language: 'de' })
        expect(speech.prompts[0]).toContain('Systems: i-doit, CheckMK, SnipeIT.')
    })

    it('reports voice as unavailable without a speech service, and rejects other content', async () => {
        let app = await buildApp({ config: loadConfig({}), llm, invokers })
        let response = await app.inject({ method: 'POST', url: '/speech/transcribe', headers: { 'content-type': 'audio/wav' }, payload: wav })
        expect(response.statusCode).toBe(503)
        app = await buildApp({ config: loadConfig({}), llm, invokers, speech: speechAnswering('x') })
        response = await app.inject({ method: 'POST', url: '/speech/transcribe', headers: { 'content-type': 'audio/wav' }, payload: Buffer.alloc(10) })
        expect(response.statusCode).toBe(400)
    })

    it('tells the frontend in /health whether voice works', async () => {
        const app = await buildApp({ config: loadConfig({}), llm, invokers, speech: speechAnswering('x') })
        expect((await app.inject({ method: 'GET', url: '/health' })).json().speech).toEqual({ available: true })
    })
})

describe('spoken e-mail addresses', () => {
    it('writes "name at domain" as an address', () => {
        expect(cleanTranscript('Open the user admin at opencelium.io.')).toBe('Open the user admin@opencelium.io')
        expect(cleanTranscript('Lösche anna.k ät becon.de')).toBe('Lösche anna.k@becon.de')
        expect(cleanTranscript('Look at the schedules')).toBe('Look at the schedules')
    })
})
