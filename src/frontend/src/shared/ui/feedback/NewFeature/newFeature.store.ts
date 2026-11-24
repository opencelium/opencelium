import { create } from 'zustand'
import type { NewFeatureId } from './newFeatures'

// Not the old `…:seen` key: that one recorded any click on the control, and only
// an explicit "Got it" should hide a badge now.
const STORAGE_KEY = 'opencelium:new-features:dismissed'

function readDismissed(): NewFeatureId[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const value: unknown = raw ? JSON.parse(raw) : []
        return Array.isArray(value) ? value.filter((id): id is NewFeatureId => typeof id === 'string') : []
    } catch {
        return []
    }
}

function writeDismissed(ids: NewFeatureId[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
        // Storage blocked (private mode, quota): the badge just comes back next session.
    }
}

type NewFeatureState = {
    dismissed: NewFeatureId[]
    dismiss: (id: NewFeatureId) => void
}

/** A store rather than per-component state so every badge for one feature (one per list row) hides together. */
export const useNewFeatureStore = create<NewFeatureState>(set => ({
    dismissed: readDismissed(),
    dismiss: id => set(state => {
        if (state.dismissed.includes(id)) return state
        const dismissed = [...state.dismissed, id]
        writeDismissed(dismissed)
        return { dismissed }
    }),
}))
