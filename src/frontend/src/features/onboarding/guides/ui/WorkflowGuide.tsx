import { useEffect } from 'react'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { TutorialSpotlight } from '../../workflow-tutorial/ui/TutorialSpotlight'
import { useGuideTracking } from '../model/useGuideTracking'
import { useWorkflowGuideStore, type ActiveWorkflowGuide } from '../model/workflowGuide.store'
import { WorkflowGuideCard } from './WorkflowGuideCard'

/** The spotlight's dark overlay is keyed off this class — see tutorialSpotlight.css. */
const DARK_CLASS = 'workflow-tutorial-dark'

function ActiveGuide({ active, onClose }: { active: ActiveWorkflowGuide; onClose: () => void }) {
    const { phase, highlight } = useGuideTracking(active, onClose)
    return (
        <>
            <TutorialSpotlight target={highlight?.target ?? null} include={highlight?.include} cue={highlight?.cue} />
            <WorkflowGuideCard guideId={active.guideId} methodLabel={active.methodLabel} phase={phase} onClose={onClose} />
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
        if (!isShown || themeMode !== 'dark') return
        const root = document.documentElement
        root.classList.add(DARK_CLASS)
        return () => root.classList.remove(DARK_CLASS)
    }, [isShown, themeMode])

    if (!isShown) return null
    return <ActiveGuide key={`${active.guideId}:${active.nodeId}`} active={active} onClose={dismiss} />
}
