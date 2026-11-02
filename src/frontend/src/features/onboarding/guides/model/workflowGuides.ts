import { buildTestId } from '@shared/testing/testId'
import type { NodeMenuActionId } from '@features/workflow/components/context-menu/contextMenuData'
import type { TutorialTarget } from '../../workflow-tutorial/model/tutorialSteps'
import type { ActiveWorkflowGuide } from './workflowGuide.store'

export const WORKFLOW_GUIDE_IDS = ['method-url', 'method-headers', 'method-body', 'method-try', 'method-transformation'] as const

export type WorkflowGuideId = (typeof WORKFLOW_GUIDE_IDS)[number]

/**
 * One step of a guide: what to point at, and the `guides.<id>.<key>` copy saying what to do there. A step is
 * current once its target is on screen; the deepest such step wins, since each only appears after the one before.
 */
export type GuideStep = {
    key: string
    link: TutorialTarget
    /** Nothing on screen tells when this step is done (writing a script): the card offers Next instead. */
    isManual?: boolean
    /** Only reachable once Next was pressed on the manual step before it. */
    isAfterNext?: boolean
}

/**
 * A guide answers "where is X" or "how do I X" on the user's own workflow: it points at the method node, then at
 * the context-menu entry, and on through the editor that entry opens. Unlike the tutorial, nothing here is fixture
 * data — the node is the user's own.
 */
export type WorkflowGuide = {
    id: WorkflowGuideId
    /** `common` key: the palette shows it, and the AI matches requests against it in English and German. */
    descriptionKey: string
    steps: (active: ActiveWorkflowGuide) => GuideStep[]
    /** What the guide leads into: once on screen and then gone, the user has closed it and the guide ends. */
    closesWith: (active: ActiveWorkflowGuide) => string
}

const sel = (testId: string) => `[data-testid="${testId}"]`

/** xyflow's own id per node — unique, unlike the name-based `workflow-node-method-*`. */
export const guideNodeTarget = (nodeId: string) => sel(`rf__node-${nodeId}`)

const menuItem = (action: NodeMenuActionId) => sel(buildTestId('workflow-context-menu', action) ?? '')

const openingSteps = (nodeId: string, action: NodeMenuActionId): GuideStep[] => [
    { key: 'node', link: { target: guideNodeTarget(nodeId), cue: 'right-click' } },
    { key: 'menu', link: { target: menuItem(action) } },
]

/** "Where is X": the node, the menu entry, and the editor it opens. */
function whereGuide(id: WorkflowGuideId, action: NodeMenuActionId, destination: string, descriptionKey: string): WorkflowGuide {
    return {
        id,
        descriptionKey,
        steps: (active) => [...openingSteps(active.nodeId, action), { key: 'arrived', link: { target: destination } }],
        closesWith: () => destination,
    }
}

const REQUEST_EDITOR = { body: sel('workflow-request-body'), header: sel('workflow-request-header') } as const
const MENU_ACTION = { body: 'edit-body', header: 'edit-headers' } as const

/** The method dialog's own Close: the editor alone will not do, since the playground folds it away. */
const METHOD_DIALOG = sel('workflow-method-dialog-close')

/**
 * "How do I apply a transformation": into the body or headers, onto a field holding a reference (a transformation
 * changes a value taken from another method), its Create button when it has none yet, the script with its AI prompt,
 * and the playground to try it. A method without such a field ends at the editor, with the copy saying why.
 */
const transformationGuide: WorkflowGuide = {
    id: 'method-transformation',
    descriptionKey: 'commandPalette.descriptions.workflowShowTransformation',
    steps: (active) => {
        if (active.guideId !== 'method-transformation') return []
        const editor = REQUEST_EDITOR[active.part]
        const opening = openingSteps(active.nodeId, MENU_ACTION[active.part])
        if (!active.field) return [...opening, { key: 'noReference', link: { target: editor } }]
        return [
            ...opening,
            // The JSON tree's rows carry no id of their own, only the key they print.
            { key: 'field', link: { target: `${editor} .variable-row`, text: `"${active.field}"` } },
            { key: 'create', link: { target: sel('workflow-enhancement-create') } },
            { key: 'script', link: { target: '#enhancement_code', include: [sel('ai-script-prompt')] }, isManual: true },
            { key: 'playground', link: { target: sel('script-playground-toggle') }, isAfterNext: true },
            { key: 'arrived', link: { target: '.scriptPlayground', include: [sel('script-playground-run')] } },
        ]
    },
    closesWith: () => METHOD_DIALOG,
}

export const WORKFLOW_GUIDES: Record<WorkflowGuideId, WorkflowGuide> = {
    'method-url': whereGuide('method-url', 'edit-url', sel('workflow-url-editor'), 'commandPalette.descriptions.workflowShowUrl'),
    'method-headers': whereGuide('method-headers', 'edit-headers', sel('workflow-request-header'), 'commandPalette.descriptions.workflowShowHeaders'),
    'method-body': whereGuide('method-body', 'edit-body', sel('workflow-request-body'), 'commandPalette.descriptions.workflowShowBody'),
    'method-try': whereGuide('method-try', 'try-request', sel('request-playground-send'), 'commandPalette.descriptions.workflowShowTry'),
    'method-transformation': transformationGuide,
}
