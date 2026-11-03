import { useEffect } from 'react'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { useBeebotFlightStore } from '@features/ai-assistant/voice/beebotFlight.store'
import { TutorialSpotlight } from '../../workflow-tutorial/ui/TutorialSpotlight'
import { useGuideTracking } from '../model/useGuideTracking'
import { useWorkflowGuideStore, type ActiveWorkflowGuide } from '../model/workflowGuide.store'
import { WorkflowGuideCard } from './WorkflowGuideCard'

/** The spotlight's dark overlay is keyed off this class — see tutorialSpotlight.css. */
const DARK_CLASS = 'workflow-tutorial-dark'
/** Lifts toasts above the spotlight — see workflowGuide.css. */
const ACTIVE_CLASS = 'workflow-guide-active'

function ActiveGuide({ active, onClose }: { active: ActiveWorkflowGuide; onClose: () => void }) {
    const { steps, current, next } = useGuideTracking(active, onClose)
    const link = steps[current]?.link
    const target = link?.target ?? null
    const text = link?.text

    // Beebot (when listening) flies to each step's target and home when the guide ends.
    useEffect(() => {
        const { land, home } = useBeebotFlightStore.getState()
        if (target) land({ selector: target, text })
        else home()
    }, [target, text])
    useEffect(() => () => useBeebotFlightStore.getState().home(), [])

    return (
        <>
            <TutorialSpotlight target={link?.target ?? null} text={link?.text} include={link?.include} cue={link?.cue} />
            <WorkflowGuideCard active={active} steps={steps} current={current} onNext={next} onClose={onClose} />
        </>
    )
}

/**
 * Shows the user where something is on their own workflow, started from the command
 * palette (`workflow show headers <method>`). Mounted globally beside the tutorial and
 * inert until a guide is started; leaving the editor ends it.
 */
export function WorkflowGuide() {
    const active = useWorkflowGuideStore(state => state.active)
    const dismiss = useWorkflowGuideStore(state => state.dismiss)
    const isEditorOpen = workflowCommandBridgeStore(state => state.isActive)
    const { themeMode } = useTheme()
    const isShown = !!active && isEditorOpen

    useEffect(() => {
        if (active && !isEditorOpen) dismiss()
    }, [active, dismiss, isEditorOpen])

    useEffect(() => {
        if (!isShown) return
        const root = document.documentElement
        const classes = themeMode === 'dark' ? [ACTIVE_CLASS, DARK_CLASS] : [ACTIVE_CLASS]
        root.classList.add(...classes)
        return () => root.classList.remove(...classes)
    }, [isShown, themeMode])

    if (!isShown) return null
    return <ActiveGuide key={`${active.guideId}:${active.nodeId}`} active={active} onClose={dismiss} />
}
