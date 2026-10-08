import { useEffect, type MutableRefObject } from 'react'
import type { OnboardingStatus, OnboardingStepId } from './types'
import { ONBOARDING_RESTART_EVENT, ONBOARDING_Z_INDEX } from './types'

const TOUR_ACTIVE_CLASS = 'onboarding-tour-active'
/** Keys typed into a control belong to that control, not to the tour. */
const INTERACTIVE = 'input, textarea, select, button, [contenteditable="true"]'

type LifecycleOptions = {
    userId?: number
    isAdmin: boolean
    hydrated: boolean
    status: OnboardingStatus
    stepId: OnboardingStepId
    /** ?onboarding=1 replays the tour even once it has been completed. */
    previewRequested: boolean
    pathname: string
    hydrate: (userId: number) => void
    start: () => void
    pause: () => void
    onRestartRequested: () => void
    onAdvance: () => void
    /** Realigns the Joyride index with the persisted step after hydration. */
    onStepRestored: (index: number) => void
    activeStepIds: OnboardingStepId[]
    /** Set while a restart navigates on purpose, so the route watcher doesn't pause. */
    allowNextRouteChangeRef: MutableRefObject<boolean>
    previousPathRef: MutableRefObject<string>
}

/**
 * Every side effect that keeps the tour in sync with the session and the router:
 * hydration, auto-start, the scroll lock, the restart command, pausing when the
 * user navigates away, and the two keyboard shortcuts.
 */
export function useTourLifecycle({
    userId, isAdmin, hydrated, status, stepId, previewRequested, pathname,
    hydrate, start, pause, onRestartRequested, onAdvance, onStepRestored, activeStepIds,
    allowNextRouteChangeRef, previousPathRef,
}: LifecycleOptions) {
    useEffect(() => {
        if (!userId) return
        hydrate(userId)
    }, [hydrate, userId])

    useEffect(() => {
        if (!hydrated || !isAdmin) return
        if (previewRequested || status === 'idle') start()
    }, [hydrated, isAdmin, previewRequested, start, status])

    useEffect(() => {
        if (!hydrated) return
        const restored = activeStepIds.indexOf(stepId)
        onStepRestored(restored >= 0 ? restored : 0)
    }, [activeStepIds, hydrated, onStepRestored, stepId])

    useEffect(() => {
        const root = document.documentElement
        const isRunning = status === 'running'
        // Measured before the class lands: the rule it feeds hides the document's
        // overflow, after which this difference always reads zero.
        const scrollbarWidth = isRunning ? window.innerWidth - root.clientWidth : 0
        root.style.setProperty('--onboarding-scrollbar-width', `${scrollbarWidth}px`)
        root.classList.toggle(TOUR_ACTIVE_CLASS, isRunning)
        // Read by the .onboarding-tour-active rules that lift antd's portals.
        root.style.setProperty('--onboarding-z-overlay', String(ONBOARDING_Z_INDEX.overlay))
        return () => {
            root.classList.remove(TOUR_ACTIVE_CLASS)
            root.style.removeProperty('--onboarding-scrollbar-width')
        }
    }, [status])

    useEffect(() => {
        if (!isAdmin) return
        window.addEventListener(ONBOARDING_RESTART_EVENT, onRestartRequested)
        return () => window.removeEventListener(ONBOARDING_RESTART_EVENT, onRestartRequested)
    }, [isAdmin, onRestartRequested])

    useEffect(() => {
        if (previousPathRef.current === pathname) return
        previousPathRef.current = pathname
        if (allowNextRouteChangeRef.current) {
            allowNextRouteChangeRef.current = false
            return
        }
        if (status === 'running') pause()
    }, [allowNextRouteChangeRef, pathname, pause, previousPathRef, status])

    useEffect(() => {
        if (status !== 'running') return
        const handleTourKeys = (event: KeyboardEvent) => {
            if ((event.target as HTMLElement | null)?.matches(INTERACTIVE)) return
            if (stepId === 'welcome' && (event.key === 'Enter' || event.key === 'ArrowRight')) {
                event.preventDefault()
                onAdvance()
            }
            if (stepId === 'palette' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                onAdvance()
            }
        }
        window.addEventListener('keydown', handleTourKeys)
        return () => window.removeEventListener('keydown', handleTourKeys)
    }, [onAdvance, status, stepId])
}
