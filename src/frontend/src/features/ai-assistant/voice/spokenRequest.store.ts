import { create } from 'zustand'

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
