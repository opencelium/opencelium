import { create } from 'zustand'
import { canSpeak, isSpeaking, speak, stopSpeaking } from './speechOutput'

const MUTE_KEY = 'oc_beebot_muted'
/** After Beebot has answered, the next thing said counts as said to it, without the name, for this long. */
export const FOLLOW_UP_AFTER_REPLY_MS = 10_000

const readMuted = (): boolean => {
    try {
        return localStorage.getItem(MUTE_KEY) === '1'
    } catch {
        return false
    }
}

type BeebotReplyState = {
    isMuted: boolean
    setMuted: (isMuted: boolean) => void
    /** A request said to Beebot is being handled: what it reports is said aloud too. */
    isAnswering: boolean
    hasReplied: boolean
    begin: () => void
    /** Says `text` when a spoken request is being answered; toasts stay the caller's. */
    reply: (text: string) => void
    /** Closes the answer; `fallback` is said when nothing else was ("Done."). */
    end: (fallback?: string) => void
    /** Until when a follow-up needs no name: counted from the end of what Beebot said. */
    followUpUntil: number
}

/**
 * Beebot's voice: only requests said to it by name are answered aloud, with the same short text their toast shows. A
 * typed request stays silent.
 */
export const useBeebotReplyStore = create<BeebotReplyState>((set, get) => ({
    isMuted: readMuted(),
    setMuted: (isMuted) => {
        try {
            localStorage.setItem(MUTE_KEY, isMuted ? '1' : '0')
        } catch {
            // The choice still holds for this page.
        }
        if (isMuted) stopSpeaking()
        set({ isMuted })
    },
    isAnswering: false,
    hasReplied: false,
    followUpUntil: 0,
    begin: () => set({ isAnswering: true, hasReplied: false }),
    reply: (text) => {
        const { isAnswering, isMuted } = get()
        if (!isAnswering) return
        set({ hasReplied: true })
        if (!isMuted && canSpeak()) speak(text, () => set({ followUpUntil: Date.now() + FOLLOW_UP_AFTER_REPLY_MS }))
    },
    end: (fallback) => {
        const { isAnswering, hasReplied } = get()
        if (isAnswering && !hasReplied && fallback) get().reply(fallback)
        // Nothing being said (muted, or no voice): the window starts now; otherwise when the speech ends.
        set({ isAnswering: false, ...(isAnswering && !isSpeaking() ? { followUpUntil: Date.now() + FOLLOW_UP_AFTER_REPLY_MS } : {}) })
    },
}))
