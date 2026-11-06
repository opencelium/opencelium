import { create } from 'zustand'

/** The "thinking" toast of a request the assistant heard; whoever handles the request closes it. */
export const SPOKEN_REQUEST_TOAST_KEY = 'spoken-request'
/** A safety net: the toast closes by itself should no palette take the request. */
export const SPOKEN_REQUEST_TOAST_SEC = 90

type SpokenRequestState = {
    /** A request heard by the always-listening assistant, for the palette's AI to act on. */
    pending: string | null
    send: (text: string) => void
    /** Hands the request to exactly one palette, however many are mounted. */
    take: () => string | null
    /** Counts "stop"s: whoever handles requests drops the one in progress when it changes. */
    cancelCount: number
    cancel: () => void
}

export const useSpokenRequestStore = create<SpokenRequestState>((set, get) => ({
    pending: null,
    send: text => set({ pending: text }),
    cancelCount: 0,
    cancel: () => set({ pending: null, cancelCount: get().cancelCount + 1 }),
    take: () => {
        const { pending } = get()
        if (pending) set({ pending: null })
        return pending
    },
}))
