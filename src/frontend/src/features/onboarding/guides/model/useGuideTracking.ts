import { useEffect, useMemo, useState } from 'react'
import { findVisibleTarget } from '../../workflow-tutorial/model/findVisibleTarget'
import { type GuideStep, WORKFLOW_GUIDES } from './workflowGuides'
import type { ActiveWorkflowGuide } from './workflowGuide.store'

type Tracking = {
    steps: GuideStep[]
    /** Index into `steps`. */
    current: number
    /** The card's Next, on a step nothing on screen can tell is done. */
    next: (() => void) | null
}

/**
 * Follows the user through a guide by watching the page rather than their clicks —
 * the context menu and the dialogs are not React state the guide can subscribe to.
 * The current step is the deepest one on screen, since each only appears once the one
 * before it was done. Once what the guide leads into has been on screen and is gone
 * again, the user has closed it: `onFinished` ends the guide.
 */
export function useGuideTracking(active: ActiveWorkflowGuide, onFinished: () => void): Tracking {
    const guide = WORKFLOW_GUIDES[active.guideId]
    const steps = useMemo(() => guide.steps(active), [guide, active])
    const closesWith = useMemo(() => guide.closesWith(active), [guide, active])
    const [current, setCurrent] = useState(0)
    const [isPastNext, setPastNext] = useState(false)

    useEffect(() => {
        let frame = 0
        let hasOpened = false
        const track = () => {
            if (findVisibleTarget(closesWith)) hasOpened = true
            else if (hasOpened) {
                onFinished()
                return
            }
            const isReached = (step: GuideStep) =>
                (!step.isAfterNext || isPastNext) && !!findVisibleTarget(step.link.target, step.link.text)
            const deepest = steps.map(isReached).lastIndexOf(true)
            setCurrent(Math.max(0, deepest))
            frame = requestAnimationFrame(track)
        }
        frame = requestAnimationFrame(track)
        return () => cancelAnimationFrame(frame)
    }, [closesWith, isPastNext, onFinished, steps])

    return { steps, current, next: steps[current]?.isManual ? () => setPastNext(true) : null }
}
