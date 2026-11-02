import { create } from 'zustand'

type SpokenRequestState = {
    /** A request heard by the always-listening assistant, for the palette's AI to act on. */
    pending: string | null
    send: (text: string) => void
    /** Hands the request to exactly one palette, however many are mounted. */
    take: () => string | null
}

export const useSpokenRequestStore = create<SpokenRequestState>((set, get) => ({
    pending: null,
    send: text => set({ pending: text }),
    take: () => {
        const { pending } = get()
        if (pending) set({ pending: null })
        return pending
    },
}))
