import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mic = vi.hoisted(() => ({
    onFrame: null as ((frame: Float32Array) => void) | null,
    result: 'started' as 'started' | 'denied',
    stop: vi.fn(),
}))
vi.mock('./microphoneFeed', () => ({
    openMicrophoneFeed: async (onFrame: (frame: Float32Array) => void) => {
        mic.onFrame = onFrame
        return mic.result === 'started' ? { kind: 'started', feed: { sampleRate: 16000, stop: mic.stop } } : { kind: 'denied' }
    },
}))
// Every frame marked as "loud" ends an utterance at once, so a test speaks one frame per utterance.
vi.mock('./utteranceSegmenter', () => ({
    createUtteranceSegmenter: () => ({ push: (frame: Float32Array) => (frame[0] ? frame : null), isHearing: () => false, reset: () => {} }),
}))
vi.mock('./wavEncoding', () => ({ samplesToSpeechWav: async () => new Blob() }))
const speech = vi.hoisted(() => ({
    transcripts: [] as string[], requests: [] as unknown[], authListeners: [] as (() => void)[], auth: 'authenticated',
    gate: null as Promise<void> | null,
}))
vi.mock('../api/aiApi', () => ({ aiApi: { endpoints: { transcribeSpeech: { initiate: (body: unknown) => body } } } }))
vi.mock('@app/store/store', () => ({
    store: {
        dispatch: (body: unknown) => {
            speech.requests.push(body)
            const text = speech.transcripts.shift() ?? ''
            return { unwrap: async () => { await speech.gate; return { text } } }
        },
        getState: () => ({ auth: { status: speech.auth } }),
        subscribe: (listener: () => void) => {
            speech.authListeners.push(listener)
            return () => {}
        },
    },
}))
const routeSpokenRequest = vi.hoisted(() => vi.fn())
vi.mock('./routeSpokenRequest', () => ({ routeSpokenRequest }))
const info = vi.hoisted(() => vi.fn())
const loading = vi.hoisted(() => vi.fn())
vi.mock('antd', () => ({ message: { info, loading, destroy: vi.fn() } }))
vi.mock('./speechOutput', () => ({ canSpeak: () => false, speak: vi.fn(), stopSpeaking: vi.fn(), isSpeaking: () => false }))
const notifyError = vi.hoisted(() => vi.fn())
vi.mock('@shared/ui/feedback/notifyError', () => ({ notifyError }))
vi.mock('@shared/i18n/config/i18n', () => ({
    i18n: { language: 'en', getFixedT: () => (key: string, values?: Record<string, string>) => `${key}${values ? JSON.stringify(values) : ''}` },
}))

import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { speechVocabulary, useWakeWordListenerStore } from './wakeWordListener.store'
import { useOpenConfirmStore } from '@shared/ui/confirm/openConfirm.store'
import { useSpokenRequestStore } from './spokenRequest.store'

/** Says one utterance and waits until the listener has dealt with it. */
async function say(transcript: string) {
    speech.transcripts.push(transcript)
    mic.onFrame?.(new Float32Array([1]))
    await vi.waitFor(() => expect(useWakeWordListenerStore.getState().isWorking).toBe(false))
}

describe('wake word listener', () => {
    beforeEach(async () => {
        mic.result = 'started'
        speech.transcripts = []
        speech.requests = []
        speech.authListeners = []
        speech.auth = 'authenticated'
        await useWakeWordListenerStore.getState().start()
    })
    afterEach(() => {
        useWakeWordListenerStore.getState().stop()
        vi.clearAllMocks()
        vi.useRealTimers()
    })

    it('transcribes with the wake word as a hint', async () => {
        await say('hello there')
        expect(speech.requests[0]).toMatchObject({ vocabulary: 'Beebot' })
    })

    it('adds the open workflow\'s method names to the hint, within the limit', () => {
        const method = (id: number) => ({ id: `m${id}`, type: 'connector', position: { x: 0, y: 0 },
            data: { title: 'CRM', subtitle: `ConfigItemOperation${id}`, kind: 'connector' } }) as unknown as WorkflowNodeModel
        workflowCommandBridgeStore.setState({ isActive: true, getNodes: () => Array.from({ length: 40 }, (_, id) => method(id)) })
        const vocabulary = speechVocabulary()
        workflowCommandBridgeStore.setState({ isActive: false })
        expect(vocabulary.startsWith('Beebot, ConfigItemOperation0, ConfigItemOperation1')).toBe(true)
        expect(vocabulary.length).toBeLessThanOrEqual(300)
    })

    it('drops what is not addressed to it', async () => {
        await say('we should check the build later')
        expect(routeSpokenRequest).not.toHaveBeenCalled()
        expect(info).not.toHaveBeenCalled()
        expect(loading).not.toHaveBeenCalled()
    })

    it('acts on what starts with its name, without the name', async () => {
        await say('Beebot, where is the header of the method?')
        expect(loading).toHaveBeenCalledWith(expect.objectContaining({
            key: 'spoken-request', content: 'commandPalette.wakeWord.heard{"name":"Beebot","text":"where is the header of the method?"}' }))
        expect(routeSpokenRequest).toHaveBeenCalledWith('where is the header of the method?')
    })

    it('takes the next utterance after the name alone as the request', async () => {
        await say('Beebot.')
        expect(info).toHaveBeenCalledWith('commandPalette.wakeWord.listening{"name":"Beebot"}')
        await say('wo ist der Body')
        expect(routeSpokenRequest).toHaveBeenCalledWith('wo ist der Body')
        // Only once: the follow-up is used up.
        await say('and now something else')
        expect(routeSpokenRequest).toHaveBeenCalledTimes(1)
    })

    it('drops utterances while two are already waiting', async () => {
        let release = () => {}
        speech.gate = new Promise<void>(resolve => { release = resolve })
        speech.transcripts.push('Beebot one', 'Beebot two', 'Beebot three')
        for (let i = 0; i < 3; i += 1) mic.onFrame?.(new Float32Array([1]))
        release()
        await vi.waitFor(() => expect(useWakeWordListenerStore.getState().isWorking).toBe(false))
        speech.gate = null
        expect(routeSpokenRequest.mock.calls.map(call => (call as unknown[])[0])).toEqual(['one', 'two'])
    })

    it('ignores a hidden tab', async () => {
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
        mic.onFrame?.(new Float32Array([1]))
        expect(speech.requests).toEqual([])
        vi.restoreAllMocks()
    })

    it('closes the microphone when the user signs out', () => {
        speech.auth = 'unauthenticated'
        speech.authListeners.forEach(listener => listener())
        expect(mic.stop).toHaveBeenCalled()
        expect(useWakeWordListenerStore.getState().status).toBe('off')
    })

    it('stops by itself after ten minutes without a request', async () => {
        useWakeWordListenerStore.getState().stop()
        vi.useFakeTimers()
        await useWakeWordListenerStore.getState().start()
        vi.advanceTimersByTime(10 * 60_000 + 30_000)
        expect(useWakeWordListenerStore.getState().status).toBe('off')
        expect(info).toHaveBeenCalledWith('commandPalette.wakeWord.autoStopped{"name":"Beebot"}')
    })

    it('reports a refused microphone and stays off', async () => {
        useWakeWordListenerStore.getState().stop()
        mic.result = 'denied'
        await useWakeWordListenerStore.getState().start()
        expect(notifyError).toHaveBeenCalledWith('commandPalette.voice.denied')
        expect(useWakeWordListenerStore.getState().status).toBe('off')
    })

    describe('answering its own question', () => {
        const ask = (isDanger: boolean, openedAt = Date.now() + 1) => {
            const answer = vi.fn()
            useOpenConfirmStore.getState().set({ text: 'Remove CreateTicket?', isDanger, openedAt, answer })
            return answer
        }
        afterEach(() => useOpenConfirmStore.getState().set(null))

        it('takes a plain "yes" or "no" without the name, right after a request', async () => {
            await say('Beebot, add a loop')
            const answer = ask(false)
            await say('yes')
            expect(answer).toHaveBeenCalledWith(true)
            expect(routeSpokenRequest).toHaveBeenCalledTimes(1)
        })

        it('needs "yes, delete" before something is removed', async () => {
            await say('Beebot, remove create ticket')
            const answer = ask(true)
            await say('yes')
            expect(answer).not.toHaveBeenCalled()
            expect(info).toHaveBeenCalledWith('commandPalette.beebot.sayYesDelete')
            await say('yes, delete')
            expect(answer).toHaveBeenCalledWith(true)
        })

        it('leaves a dialog the user opened long after their last request to the mouse', async () => {
            await say('Beebot, add a loop')
            const answer = ask(false, Date.now() + 120_000)
            await say('yes')
            expect(answer).not.toHaveBeenCalled()
        })
    })

    it('on "stop", declines the open question and drops the request in progress', async () => {
        await say('Beebot, remove create ticket')
        const answer = vi.fn()
        useOpenConfirmStore.getState().set({ text: '', isDanger: true, openedAt: Date.now() + 1, answer })
        const cancelled = useSpokenRequestStore.getState().cancelCount
        await say('Beebot, stop')
        expect(answer).toHaveBeenCalledWith(false)
        expect(useSpokenRequestStore.getState().cancelCount).toBe(cancelled + 1)
        expect(useWakeWordListenerStore.getState().status).toBe('on')
        useOpenConfirmStore.getState().set(null)
    })

    it('turns itself off on "stop listening"', async () => {
        await say('Beebot, stop listening')
        expect(useWakeWordListenerStore.getState().status).toBe('off')
        expect(routeSpokenRequest).not.toHaveBeenCalled()
    })

    it('takes the next thing said without the name for a short while after Beebot answered', async () => {
        const { useBeebotReplyStore } = await import('./beebotReply.store')
        useBeebotReplyStore.setState({ followUpUntil: Date.now() + 10_000 })
        await say('now add an if after it')
        expect(routeSpokenRequest).toHaveBeenCalledWith('now add an if after it')
        useBeebotReplyStore.setState({ followUpUntil: 0 })
        await say('and something unrelated')
        expect(routeSpokenRequest).toHaveBeenCalledTimes(1)
    })
})
