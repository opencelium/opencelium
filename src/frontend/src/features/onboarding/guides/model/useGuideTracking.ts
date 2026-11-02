import { useEffect, useMemo, useState } from 'react'
import { findVisibleTarget } from '../../workflow-tutorial/model/findVisibleTarget'
import type { TutorialTarget } from '../../workflow-tutorial/model/tutorialSteps'
import { buildGuideChain, WORKFLOW_GUIDES } from './workflowGuides'
import type { ActiveWorkflowGuide } from './workflowGuide.store'

export type GuidePhase = 'node' | 'menu' | 'arrived'

type Tracking = { phase: GuidePhase; highlight: TutorialTarget | null }

/** The deepest link on screen: each one only exists once the previous was clicked. */
const deepestVisible = (chain: TutorialTarget[]) =>
    [...chain].reverse().find(link => findVisibleTarget(link.target)) ?? null

/**
 * Follows the user through a guide by watching the page rather than their clicks —
 * the context menu and the dialogs are not React state the guide can subscribe to.
 * Once the destination has been on screen and is gone again, the user has closed it:
 * the question is answered and `onFinished` ends the guide.
 */
export function useGuideTracking(active: ActiveWorkflowGuide, onFinished: () => void): Tracking {
    const guide = WORKFLOW_GUIDES[active.guideId]
    const chain = useMemo(() => buildGuideChain(guide, active.nodeId), [guide, active.nodeId])
    const arrivedLink = useMemo<TutorialTarget>(() => ({ target: guide.destination }), [guide])
    const [tracking, setTracking] = useState<Tracking>({ phase: 'node', highlight: chain[0] })

    useEffect(() => {
        let frame = 0
        let hasArrived = false
        const track = () => {
            if (findVisibleTarget(guide.destination)) {
                hasArrived = true
                setTracking(current => current.highlight === arrivedLink ? current : { phase: 'arrived', highlight: arrivedLink })
            } else if (hasArrived) {
                onFinished()
                return
            } else {
                const link = deepestVisible(chain)
                const phase: GuidePhase = link === chain[1] ? 'menu' : 'node'
                setTracking(current => current.highlight === link ? current : { phase, highlight: link })
            }
            frame = requestAnimationFrame(track)
        }
        frame = requestAnimationFrame(track)
        return () => cancelAnimationFrame(frame)
    }, [arrivedLink, chain, guide.destination, onFinished])

    return tracking
}
