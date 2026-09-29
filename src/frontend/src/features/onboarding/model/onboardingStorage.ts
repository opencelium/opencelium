import type { PersistedOnboardingState } from './types'

const STORAGE_PREFIX = 'opencelium:onboarding:'

function storageKey(userId: number) {
    return `${STORAGE_PREFIX}${userId}`
}

export function readOnboardingState(userId: number): PersistedOnboardingState | null {
    try {
        const raw = localStorage.getItem(storageKey(userId))
        if (!raw) return null

        const value = JSON.parse(raw) as Partial<PersistedOnboardingState>
        if (value.userId !== userId || typeof value.stepId !== 'string') return null
        if (!['idle', 'running', 'paused', 'tour-complete', 'completed'].includes(value.status ?? '')) return null

        return {
            userId,
            stepId: value.stepId as PersistedOnboardingState['stepId'],
            status: value.status as PersistedOnboardingState['status'],
            checklistDismissed: Boolean(value.checklistDismissed),
        }
    } catch {
        return null
    }
}

export function writeOnboardingState(state: PersistedOnboardingState) {
    localStorage.setItem(storageKey(state.userId), JSON.stringify(state))
}

export function clearOnboardingState(userId: number) {
    localStorage.removeItem(storageKey(userId))
}
