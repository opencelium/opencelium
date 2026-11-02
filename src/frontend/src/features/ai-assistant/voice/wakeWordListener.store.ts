import { message } from 'antd'
import { create } from 'zustand'
import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { guideMethodNames } from '@features/onboarding/guides/model/resolveGuideNode'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { aiApi } from '../api/aiApi'
import { openMicrophoneFeed, type MicrophoneFeed } from './microphoneFeed'
import { routeSpokenRequest } from './routeSpokenRequest'
import { SPOKEN_REQUEST_TOAST_KEY, SPOKEN_REQUEST_TOAST_SEC } from './spokenRequest.store'
import { createUtteranceSegmenter, type UtteranceSegmenter } from './utteranceSegmenter'
import { samplesToSpeechWav } from './wavEncoding'
import { matchWakeWord, WAKE_WORD } from './wakeWord'

/** After the name alone ("Beebot."), the next utterance counts as addressed without it. */
const FOLLOW_UP_MS = 8_000
/** Stops listening after this long without a request: an open microphone nobody uses is a privacy cost. */
const IDLE_STOP_MS = 10 * 60_000
const IDLE_CHECK_MS = 30_000
/** Utterances waiting for transcription; anything beyond is dropped rather than answered minutes late. */
const MAX_QUEUED = 2
/** The gateway's limit for the transcription hint. */
const MAX_VOCABULARY_CHARS = 300

/**
 * What whisper should expect to hear: the name, and in the editor the workflow's method
 * names, which it otherwise spells as ordinary words ("ConfigItemGit").
 */
export function speechVocabulary(): string {
    const bridge = workflowCommandBridgeStore.getState()
    const words = [WAKE_WORD.name, ...(bridge.isActive ? guideMethodNames(bridge.getNodes()) : [])]
    let vocabulary = ''
    for (const word of words) {
        const next = vocabulary ? `${vocabulary}, ${word}` : word
        if (next.length > MAX_VOCABULARY_CHARS) break
        vocabulary = next
    }
    return vocabulary
}

type ListenerStatus = 'off' | 'starting' | 'on'

type WakeWordListenerState = {
    status: ListenerStatus
    /** Input loudness, for the indicator. */
    level: number
    /** Speech is being collected right now. */
    isHearing: boolean
    /** An utterance is being transcribed or acted on. */
    isWorking: boolean
    start: () => Promise<void>
    stop: () => void
}

type Session = {
    feed: MicrophoneFeed
    segmenter: UtteranceSegmenter
    idleTimer: number
    unsubscribeAuth: () => void
    lastRequestAt: number
    followUpUntil: number
    queued: number
    chain: Promise<void>
}

const tCommon = () => i18n.getFixedT(i18n.language, 'common')

let session: Session | null = null

export const useWakeWordListenerStore = create<WakeWordListenerState>((set, get) => {
    const setWorking = (current: Session) => set({ isWorking: current.queued > 0 })

    const handleUtterance = async (current: Session, samples: Float32Array) => {
        const wav = await samplesToSpeechWav(samples, current.feed.sampleRate)
        const result = await store.dispatch(aiApi.endpoints.transcribeSpeech.initiate({ wav, vocabulary: speechVocabulary() }))
            .unwrap().catch(() => undefined)
        if (!result?.text || session !== current) return
        const match = matchWakeWord(result.text)
        const isFollowUp = Date.now() < current.followUpUntil
        // Everything not addressed to the assistant is dropped here: never shown, never stored.
        if (!match.isAddressed && !isFollowUp) return
        const request = match.isAddressed ? match.request : result.text.trim()
        current.lastRequestAt = Date.now()
        const t = tCommon()
        if (!request) {
            current.followUpUntil = Date.now() + FOLLOW_UP_MS
            message.info(t('commandPalette.wakeWord.listening', { name: WAKE_WORD.name }))
            return
        }
        current.followUpUntil = 0
        message.loading({ key: SPOKEN_REQUEST_TOAST_KEY, duration: SPOKEN_REQUEST_TOAST_SEC,
            content: t('commandPalette.wakeWord.heard', { name: WAKE_WORD.name, text: request }) })
        routeSpokenRequest(request)
    }

    const enqueue = (current: Session, samples: Float32Array) => {
        if (current.queued >= MAX_QUEUED) return
        current.queued += 1
        setWorking(current)
        current.chain = current.chain
            .then(() => handleUtterance(current, samples))
            .catch(() => undefined)
            .finally(() => {
                current.queued -= 1
                setWorking(current)
            })
    }

    const onFrame = (frame: Float32Array) => {
        const current = session
        if (!current) return
        // A hidden tab is not being talked to; nothing is transcribed until it is back.
        if (document.hidden) {
            current.segmenter.reset()
            return
        }
        const utterance = current.segmenter.push(frame)
        const level = Math.sqrt(frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length)
        set({ level, isHearing: current.segmenter.isHearing() })
        if (utterance) enqueue(current, utterance)
    }

    const stop = () => {
        const current = session
        session = null
        if (current) {
            current.feed.stop()
            window.clearInterval(current.idleTimer)
            current.unsubscribeAuth()
        }
        set({ status: 'off', level: 0, isHearing: false, isWorking: false })
    }

    const start = async () => {
        if (get().status !== 'off') return
        set({ status: 'starting' })
        const opened = await openMicrophoneFeed(onFrame)
        // Stopped while the permission prompt was open.
        if (get().status !== 'starting') {
            if (opened.kind === 'started') opened.feed.stop()
            return
        }
        if (opened.kind !== 'started') {
            set({ status: 'off' })
            notifyError(tCommon()(opened.kind === 'denied' ? 'commandPalette.voice.denied' : 'commandPalette.voice.failed'))
            return
        }
        const current: Session = {
            feed: opened.feed,
            segmenter: createUtteranceSegmenter({ sampleRate: opened.feed.sampleRate }),
            idleTimer: window.setInterval(() => {
                if (session !== current || Date.now() - current.lastRequestAt < IDLE_STOP_MS) return
                stop()
                message.info(tCommon()('commandPalette.wakeWord.autoStopped', { name: WAKE_WORD.name }))
            }, IDLE_CHECK_MS),
            // Signing out (or a session expiring) closes the microphone with it.
            unsubscribeAuth: store.subscribe(() => {
                if (store.getState().auth.status === 'unauthenticated') stop()
            }),
            lastRequestAt: Date.now(),
            followUpUntil: 0,
            queued: 0,
            chain: Promise.resolve(),
        }
        session = current
        set({ status: 'on' })
    }

    return { status: 'off', level: 0, isHearing: false, isWorking: false, start, stop }
})
