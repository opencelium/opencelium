import { useEffect, useRef } from 'react'
import type { OnboardingStatus, OnboardingStepId } from './types'

type ResumeOptions = {
    /** Rows the relevant list currently holds; ignored until `loaded`. */
    count: number
    loaded: boolean
    status: OnboardingStatus
    stepId: OnboardingStepId
    /** Only a tour paused on this step is resumed. */
    resumeOnStep: OnboardingStepId
    onResume: () => void
}

/**
 * The invoker and connector steps hand the user off to the real entity form,
 * pausing the tour. Nothing in those forms knows about the tour, so rather than
 * threading a callback through the entity engine we watch the corresponding
 * list: it refetches on a successful create (the mutation invalidates the
 * `Entity` tag), and a paused tour sitting on that step takes the growth as the
 * step being done.
 *
 * Only an increase counts, and only once the list has actually loaded — the
 * query starts out undefined, and treating that as zero would read a reload of
 * three existing rows as three fresh creations.
 */
export function useResumeAfterEntityCreated({
    count, loaded, status, stepId, resumeOnStep, onResume,
}: ResumeOptions) {
    const lastCountRef = useRef<number | null>(null)

    useEffect(() => {
        if (!loaded) return

        const previous = lastCountRef.current
        lastCountRef.current = count

        // First loaded value only establishes the baseline.
        if (previous === null || count <= previous) return
        if (status !== 'paused' || stepId !== resumeOnStep) return

        onResume()
    }, [count, loaded, onResume, resumeOnStep, status, stepId])
}
