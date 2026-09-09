import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { runWithoutUnsavedChangesGuard } from '@features/workflow/hooks/unsavedChangesGuard'
import { useCanvasProgress } from '../model/useCanvasProgress'
import { resolveHighlight, resolveStepIndex, TUTORIAL_STEPS, type TutorialTarget } from '../model/tutorialSteps'
import { useWorkflowTutorialStore } from '../model/workflowTutorial.store'
import { TutorialPill } from './TutorialPill'
import { TutorialSpotlight } from './TutorialSpotlight'
import './workflowTutorial.css'

/** Only the create route: an existing workflow has real connectors to protect. */
const TUTORIAL_ROUTE = '/workflow/create'
/** Suppresses save while the graph is built from invented systems. */
const ACTIVE_CLASS = 'workflow-tutorial-active'

/**
 * Teaches the real editor on invented data. Not built on Joyride, unlike the
 * onboarding tour: the two things Joyride provides are target positioning and a
 * tooltip anchored to the target, and this tutorial overrides both — the copy is
 * pinned to a corner while the highlight walks a chain of controls.
 *
 * Mounted globally beside the onboarding tour and inert until the user is on
 * /workflow/create with the tutorial requested, so the workflow feature itself
 * needs no knowledge of it.
 */
export function WorkflowTutorial() {
    const isAdmin = useIsAdmin()
    const location = useLocation()
    const navigate = useNavigate()
    const { requested, dismiss } = useWorkflowTutorialStore()
    /** How far the user has clicked through the steps the canvas cannot detect. */
    const [acknowledged, setAcknowledged] = useState(0)

    const active = isAdmin && requested && location.pathname.startsWith(TUTORIAL_ROUTE)
    const progress = useCanvasProgress(active)
    // Read off the canvas, so finishing a step's task opens the next one immediately.
    const index = resolveStepIndex(progress, acknowledged)
    const step = TUTORIAL_STEPS[index]

    const [highlight, setHighlight] = useState<TutorialTarget | null>(null)

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle(ACTIVE_CLASS, active)
        return () => root.classList.remove(ACTIVE_CLASS)
    }, [active])

    // Which link of the chain to point at depends on what is currently rendered, so
    // it is polled rather than derived: opening a drawer is not a React update here.
    // No reset when inactive: the component renders nothing in that case, so a
    // stale value is invisible — and resetting here would be a setState in the
    // effect body.
    useEffect(() => {
        if (!active || !step) return
        let frame = 0
        const track = () => {
            const next = resolveHighlight(step.chain, progress)
            // Chain links are stable module-level objects, so identity is enough.
            setHighlight(current => (current === next ? current : next))
            frame = requestAnimationFrame(track)
        }
        frame = requestAnimationFrame(track)
        return () => cancelAnimationFrame(frame)
        // `progress` gates some links, so the loop is rebuilt when it changes — which
        // is a handful of times per tutorial, not per frame.
    }, [active, step, progress])

    // The graph is built from invented connectors, so it must not outlive the
    // tutorial: the moment the active class goes, Save is live again and those ids
    // would be postable. Re-navigating to the same route is the editor's own reset
    // path — `ResettableRoute` keys the subtree on `location.key`, which a same-path
    // navigation changes — so the canvas empties without reaching into the workflow
    // feature's state. `replace`, so Back does not return to the tutorial's graph.
    const close = useCallback(() => {
        setAcknowledged(0)
        dismiss()
        // Unguarded: the editor treats the tutorial's graph as unsaved changes and
        // would ask whether to discard them, which is a strange thing to be asked
        // after pressing "Got it" on a sandbox that was never savable.
        runWithoutUnsavedChangesGuard(() => navigate(TUTORIAL_ROUTE, { replace: true }))
    }, [dismiss, navigate])

    const acknowledge = useCallback(() => setAcknowledged(index + 1), [index])

    if (!active || !step) return null

    const isLast = index === TUTORIAL_STEPS.length - 1
    return (
        <>
            <TutorialSpotlight target={highlight?.target ?? null} include={highlight?.include}
                cue={highlight?.cue} text={highlight?.text} />
            <TutorialPill
                copy={step.copy}
                example={step.example}
                index={index}
                total={TUTORIAL_STEPS.length}
                // Only the undetectable steps get a Next; the rest advance on their own.
                onNext={step.isDone || isLast ? undefined : acknowledge}
                onClose={close}
            />
        </>
    )
}
