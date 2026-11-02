import { buildTestId } from '@shared/testing/testId'
import type { NodeMenuActionId } from '@features/workflow/components/context-menu/contextMenuData'
import type { TutorialTarget } from '../../workflow-tutorial/model/tutorialSteps'

export const WORKFLOW_GUIDE_IDS = ['method-url', 'method-headers', 'method-body', 'method-try'] as const

export type WorkflowGuideId = (typeof WORKFLOW_GUIDE_IDS)[number]

/**
 * A guide answers "where is X" on the user's own workflow: it points at the method
 * node, then at the context-menu entry, and settles on the editor that entry opens.
 * Unlike the tutorial, nothing here is fixture data — the node is the user's own.
 */
export type WorkflowGuide = {
    id: WorkflowGuideId
    /** The context-menu entry that opens what the guide is about. */
    menuAction: NodeMenuActionId
    /** Shown once the user has arrived: its presence is what "done" means. */
    destination: string
}

const sel = (testId: string) => `[data-testid="${testId}"]`

/** xyflow's own id per node — unique, unlike the name-based `workflow-node-method-*`. */
export const guideNodeTarget = (nodeId: string) => sel(`rf__node-${nodeId}`)

export const WORKFLOW_GUIDES: Record<WorkflowGuideId, WorkflowGuide> = {
    'method-url': { id: 'method-url', menuAction: 'edit-url', destination: sel('workflow-url-editor') },
    'method-headers': { id: 'method-headers', menuAction: 'edit-headers', destination: sel('workflow-request-header') },
    'method-body': { id: 'method-body', menuAction: 'edit-body', destination: sel('workflow-request-body') },
    'method-try': { id: 'method-try', menuAction: 'try-request', destination: sel('request-playground-send') },
}

export function buildGuideChain(guide: WorkflowGuide, nodeId: string): TutorialTarget[] {
    const menuItem = sel(buildTestId('workflow-context-menu', guide.menuAction) ?? '')
    return [
        { target: guideNodeTarget(nodeId), cue: 'right-click' },
        { target: menuItem },
    ]
}
