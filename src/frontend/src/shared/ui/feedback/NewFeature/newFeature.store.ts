import { create } from 'zustand'
import type { NewFeatureId } from './newFeatures'

const STORAGE_KEY = 'opencelium:new-features:seen'

function readSeen(): NewFeatureId[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const value: unknown = raw ? JSON.parse(raw) : []
        return Array.isArray(value) ? value.filter((id): id is NewFeatureId => typeof id === 'string') : []
    } catch {
        return []
    }
}

function writeSeen(ids: NewFeatureId[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
        // Storage blocked (private mode, quota): the badge just comes back next session.
    }
}

type NewFeatureState = {
    seen: NewFeatureId[]
    markSeen: (id: NewFeatureId) => void
}

/** A store rather than per-component state so every badge for one feature (one per list row) hides together. */
export const useNewFeatureStore = create<NewFeatureState>(set => ({
    seen: readSeen(),
    markSeen: id => set(state => {
        if (state.seen.includes(id)) return state
        const seen = [...state.seen, id]
        writeSeen(seen)
        return { seen }
    }),
}))
