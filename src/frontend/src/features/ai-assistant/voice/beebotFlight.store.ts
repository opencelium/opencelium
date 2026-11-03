import { create } from 'zustand'

/** What the bee flies to: an element found the way the guide spotlight finds it (selector, optionally its text). */
export type BeebotDestination = { selector: string; text?: string }

type BeebotFlightState = {
    destination: BeebotDestination | null
    /** The bee has left the toggle, so the toggle hides its own glyph and only one bee is on screen. */
    isAway: boolean
    land: (destination: BeebotDestination) => void
    home: () => void
    setAway: (isAway: boolean) => void
}

export const useBeebotFlightStore = create<BeebotFlightState>(set => ({
    destination: null,
    isAway: false,
    land: destination => set({ destination }),
    home: () => set({ destination: null }),
    setAway: isAway => set({ isAway }),
}))
