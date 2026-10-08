import { create } from 'zustand'
import { clearOnboardingState, readOnboardingState, writeOnboardingState } from './onboardingStorage'
import type { OnboardingStatus, OnboardingStepId, PersistedOnboardingState } from './types'

type OnboardingState = {
    userId: number | null
    hydrated: boolean
    stepId: OnboardingStepId
    status: OnboardingStatus
    checklistDismissed: boolean
    hydrate: (userId: number) => void
    start: () => void
    goTo: (stepId: OnboardingStepId) => void
    pause: () => void
    finishTour: () => void
    complete: () => void
    dismissChecklist: () => void
    restart: () => void
}

const initialState = {
    userId: null,
    hydrated: false,
    stepId: 'welcome' as OnboardingStepId,
    status: 'idle' as OnboardingStatus,
    checklistDismissed: false,
}

function persist(state: Pick<OnboardingState, 'userId' | 'stepId' | 'status' | 'checklistDismissed'>) {
    if (state.userId === null) return
    writeOnboardingState(state as PersistedOnboardingState)
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    ...initialState,
    hydrate: userId => {
        const cached = readOnboardingState(userId)
        set(cached ? { ...cached, hydrated: true } : { ...initialState, userId, hydrated: true })
    },
    start: () => set(state => {
        const next = { ...state, status: 'running' as const }
        persist(next)
        return next
    }),
    goTo: stepId => set(state => {
        const next = { ...state, stepId, status: 'running' as const }
        persist(next)
        return next
    }),
    pause: () => set(state => {
        const next = { ...state, status: 'paused' as const }
        persist(next)
        return next
    }),
    finishTour: () => set(state => {
        const next = { ...state, status: 'tour-complete' as const }
        persist(next)
        return next
    }),
    complete: () => set(state => {
        const next = { ...state, status: 'completed' as const }
        persist(next)
        return next
    }),
    dismissChecklist: () => set(state => {
        const next = { ...state, checklistDismissed: true }
        persist(next)
        return next
    }),
    restart: () => {
        const userId = get().userId
        if (userId !== null) clearOnboardingState(userId)
        const next = { ...initialState, userId, hydrated: true, status: 'running' as const }
        persist(next)
        set(next)
    },
}))
