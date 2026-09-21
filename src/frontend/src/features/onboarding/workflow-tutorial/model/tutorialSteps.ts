import { buildTestId } from '@shared/testing/testId'
import { REFERENCE_POPUP_CLASS } from '@features/workflow/components/method-select/ReferenceMethodSelect'
import { buildReferenceValue, ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'
import { getMethodKey } from '@features/workflow/components/WorkflowSidebar/useWorkflowSidebarItems'
import { TUTORIAL_CONNECTORS } from './tutorialFixtures'
import type { CanvasProgress } from './useCanvasProgress'
import { findVisibleTarget } from './findVisibleTarget'

/**
 * `buildTestId` returns undefined when every part is empty, which cannot happen for
 * the fixed prefixes below — throwing rather than emitting `[data-testid="undefined"]`
 * keeps a silently-dead selector from looking like "nothing to highlight".
 */
const sel = (testId: string | undefined) => {
    if (!testId) throw new Error('workflow tutorial: empty test id')
    return `[data-testid="${testId}"]`
}

/**
 * Selectors are composed with the same `buildTestId` the sidebar renders with, from
 * the fixtures themselves — so a renamed method or a re-keyed row cannot leave the
 * tutorial pointing at nothing.
 */
/**
 * An insertion point, scoped to the node that owns it. Which one matters: on an
 * operator, `bottom` adds *into* its scope — giving the child a nested index like
 * `1_0` — while `right` continues past it at `2`. See buildWorkflowIndexes.
 */
const ADD_FROM = (node: string, direction: 'right' | 'bottom') =>
    `${node} ${sel(buildTestId('workflow-add-step', direction))}`
const MAIN = (key: string) => sel(buildTestId('workflow-sidebar-main', 'item', key))
const CONNECTOR = (connectorId: number) => sel(buildTestId('workflow-sidebar-connector', 'item', connectorId))
const METHOD = (connectorIndex: number, methodIndex: number) => {
    const operation = TUTORIAL_CONNECTORS[connectorIndex].invoker.operations[methodIndex]
    return sel(buildTestId('workflow-sidebar-method', 'item', getMethodKey(operation, methodIndex)))
}
const OPERATOR = (kind: 'if' | 'loop') => sel(buildTestId('workflow-sidebar-operator', 'item', kind))
/** @xyflow/react's own classes for node types — see workflowCanvasTypes. */
const START_NODE = '.react-flow__node-start'
const LOOP_NODE = '.react-flow__node-loop'
const IF_NODE = '.react-flow__node-if'
/** A placed method, addressed by the method it runs rather than its generated id. */
const METHOD_NODE = (connectorIndex: number, methodIndex: number) =>
    sel(buildTestId('workflow-node-method',
        TUTORIAL_CONNECTORS[connectorIndex].invoker.operations[methodIndex].name))
/** Right-click actions on a node; the request editors open from here. */
const CONTEXT = (action: string) => sel(buildTestId('workflow-context-menu', action))
const URL_INSERT_REFERENCE = sel('workflow-url-insert-reference')
const REFERENCE_GENERATOR = sel('workflow-reference-generator')
const CONDITION_BUILDER = sel('workflow-condition-builder')
const CONDITION_ADD = sel('workflow-condition-add-condition')
/**
 * One comparison row: the two reference sides and the operator between them. An IF
 * opens with none — hence its Add Condition button — while a loop's group is created
 * holding one, so for the loop this link resolves as soon as the dialog does.
 * See conditionTreeFactory.createEmptyGroup.
 */
const CONDITION_RULE = sel('workflow-condition-rule')
/**
 * How each dialog is finished. Undimmed with the row being filled in, because a
 * highlight that only ever points inward leaves the user with nowhere to go once the
 * work is done — and for the conditions, the save is what the step waits on.
 */
const CONDITION_SAVE = sel('workflow-condition-save')
const METHOD_DIALOG_CLOSE = sel('workflow-method-dialog-close')
const URL_EDITOR = sel('workflow-url-editor')
/** The request body's JSON tree, and one key's row inside it. */
const BODY_DATA = sel('workflow-request-body')
const BODY_ROW = `${BODY_DATA} .variable-row`
/**
 * Variable Information: where an enhancement's VAR_0/VAR_1 are listed once the field
 * holds two references, and the fold that reveals it. The enhancement pane creates
 * that panel closed (`defaultActiveKeys={[]}` in Enhancement), so the variables are
 * folded away until asked for.
 */
const VARIABLES = sel('workflow-enhancement-variables')
const VARIABLES_TOGGLE = sel('workflow-enhancement-variables-toggle')
/** Its method list is portalled to the body — see REFERENCE_POPUP_CLASS. */
const REFERENCE_POPUP = `.${REFERENCE_POPUP_CLASS}`
/**
 * Whichever select is open right now. Every picker in these dialogs portals its list
 * to the body, so the list falls outside the row it belongs to and would be left
 * dimmed — unreadable at the moment the user needs to choose from it. Undimming it
 * grows the cut-out downward over the options.
 *
 * Generic on purpose: `findVisibleTarget` skips the hidden ones antd leaves mounted,
 * so this resolves to the one list actually on screen.
 */
const OPEN_DROPDOWN = '.ant-select-dropdown'
/**
 * The enhancement's script editor. react-ace renders its `name` as the container's
 * DOM id, and EnhancementScript hardcodes that name — so this is as stable as a
 * testid without adding one. Not `workflow-enhancement-create`: that button belongs
 * to the single-reference case, and a field holding two of them is wrapped in an
 * enhancement on its own.
 */
const ENHANCEMENT_SCRIPT = '#enhancement_code'

/**
 * The start node's own button — the one control on the canvas that is not an
 * insertion point. Every test-run step opens on it, so a step the user reaches with
 * no run playing points at the way to start one rather than at nothing: the debug
 * controls below exist only while a run is on, and `resolveHighlight` takes the
 * deepest link that is actually rendered.
 */
const START_BUTTON = '.startNodeButton'
/** The mode dialog the start button raises. Skipped when the user has silenced it. */
const TEST_MODE_DEBUG = sel('workflow-test-run-mode-start-debug')
const TEST_MODE_LIVE = sel('workflow-test-run-mode-start-live')
/** The replay debugger, docked beside the zoom controls; absent in live mode. */
const PAUSE_BUTTON = sel('workflow-test-pause-button')
const STEP_BUTTON = sel('workflow-test-step-forward-button')
const SPEED_CONTROL = sel('workflow-test-speed-control')
const LIVE_TOGGLE = sel('workflow-logs-live-toggle')
/**
 * A loop node's replay controls, which appear on it only while the run is paused
 * inside that loop. Addressed by prefix: both carry the node's generated id.
 */
const SKIP_ITERATION = '[data-testid^="workflow-node-skip-iteration-"]'
const ITERATION_INPUT = '[data-testid^="workflow-node-iteration-input-"]'
/** The log panel's tree, which only has the class once it has rows to show. */
const LOG_TREE = '.logsBodyTree'

const [CRM, SUPPORT] = [0, 1]

/** One link of a chain: the control to click, plus anything to undim alongside it. */
export type TutorialTarget = {
    target: string
    /** Left undimmed with the target, for context — a `+` alone reads as an artefact. */
    include?: string[]
    /**
     * A badge saying how to act on the target, for a gesture nothing on screen
     * advertises: a node carries no hint that it has a context menu, nor that
     * double-clicking an operator opens its condition (see useWorkflowCanvasActions).
     */
    cue?: 'right-click' | 'double-click' | 'reference'
    /**
     * Narrows the match to an element showing this text. The request body is a JSON
     * tree (react-json-view) whose rows carry no id of their own, so the only way to
     * mean "the username row" is the key it prints.
     */
    text?: string
    /**
     * Only eligible while this holds. Visibility alone cannot express a control that
     * becomes the task partway through a step: the request editor's close button is on
     * screen from the moment it opens, but is only what to press once the reference is
     * in — and the generator that put it there closes itself on apply, so without this
     * the highlight falls back to the button that opened it.
     */
    when?: (progress: CanvasProgress) => boolean
}

export type TutorialStep = {
    id: string
    /**
     * Which corner the copy sits in. Bottom-left by default, which is clear for as
     * long as the work happens in dialogs and the right-hand drawer — but a test run
     * opens the log panel across the bottom of the page, and the pill would then
     * cover the tree it is describing. `center` is for the introduction alone: the
     * canvas is empty at that point, so there is nothing behind it for a middle
     * placement to cover, and centred reads as "start here" rather than a hint
     * about one particular control.
     */
    anchor?: 'top-right' | 'center'
    /**
     * A snippet shown under the copy. Lives here rather than in the locale files
     * because it is a code sample, not prose — both languages had it identical, and
     * the endpoint one is generated so it cannot drift from what the app produces.
     */
    example?: string

    /** Suffix under `workflow.steps.*` for this step's title/body/hint copy. */
    copy: string
    /**
     * Where to click, in order. The deepest link whose target is currently on screen
     * is the one highlighted — each panel only exists once the previous row was
     * clicked, so the chain tracks progress without listening for clicks.
     */
    chain: TutorialTarget[]
    /**
     * Whether the canvas already shows this step's result, which is what advances the
     * pill. Absent for the two steps that teach configuration inside a dialog — a
     * reference in an endpoint, an enhancement over a body field — because nothing
     * about that is visible on the graph. Those wait for the user to say they are done.
     */
    isDone?: (progress: CanvasProgress) => boolean
}

/**
 * What the endpoint step's reference ends up looking like, composed by the same
 * function the reference generator applies — so a change to the reference format
 * shows up in the tutorial's own example instead of quietly contradicting it.
 * `ITERATOR_NAMES[0]` is the outermost loop's iterator, which is the one on offer
 * here, and the leading `#` is what normalizeReference prepends on insertion.
 */
const EXAMPLE_METHOD_COLOR = 'a1b2c3'
const ENDPOINT_EXAMPLE =
    `/clients?email=#${buildReferenceValue(EXAMPLE_METHOD_COLOR, 'body', `customers[${ITERATOR_NAMES[0]}].email`)}`
/**
 * What the loop iterates: the whole array, which is the `[*]` option in the field
 * picker. Not an iterator — that is what the loop hands to the steps inside it — and
 * not `[0]`, which would pin every iteration to the first customer.
 */
const LOOP_EXAMPLE = `#${buildReferenceValue(EXAMPLE_METHOD_COLOR, 'body', 'customers[*]')}`
/**
 * The IF's comparison, written as the two field paths rather than whole references:
 * that is how the dialog's own selects read them back, and the full form would be
 * two 50-character strings in a corner pill. The iterator still comes from the app,
 * so the loop-scoped side cannot drift.
 */
const CONDITION_EXAMPLE = `client.email ≠ customers[${ITERATOR_NAMES[0]}].email`
/** The enhancement's script: two references in, one joined value out. */
const USERNAME_EXAMPLE = 'RESULT_VAR = VAR_0 + " " + VAR_1'

/** The first `+` sits on the start node, which is undimmed with it for context. */
const FROM_START: TutorialTarget = { target: ADD_FROM(START_NODE, 'right'), include: [START_NODE] }

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        // Nothing to point at: the graph is still empty, so there is no chain and
        // the pill takes the centre instead of a corner. Same "hold until acknowledged"
        // mechanism as `speed`/`logs` below — no `isDone`, so it waits for Next.
        id: 'intro',
        copy: 'intro',
        anchor: 'center',
        chain: [],
    },
    {
        id: 'customers',
        copy: 'customers',
        chain: [FROM_START, { target: MAIN('connector') }, { target: CONNECTOR(TUTORIAL_CONNECTORS[CRM].connectorId) }, { target: METHOD(CRM, 0) }],
        isDone: progress => progress.methods >= 1,
    },
    {
        id: 'loop',
        copy: 'loop',
        chain: [
            { target: ADD_FROM(METHOD_NODE(CRM, 0), 'right') },
            { target: MAIN('operator') },
            { target: OPERATOR('loop') },
        ],
        isDone: progress => progress.hasLoop,
    },
    {
        // Only the loop node is pointed at here: the work happens in a dialog behind
        // its context menu, so there is no second control to undim alongside it.
        id: 'iterate',
        copy: 'iterate',
        example: LOOP_EXAMPLE,
        chain: [
            { target: LOOP_NODE, cue: 'right-click' },
            { target: CONTEXT('open-config') },
            { target: CONDITION_BUILDER },
            { target: CONDITION_RULE, include: [OPEN_DROPDOWN, CONDITION_SAVE] },
        ],
        isDone: progress => progress.loopConditionSaved,
    },
    {
        // The lookup belongs *inside* the loop, so it is the loop's bottom trigger that
        // is pointed at: its right one would place the method after the loop instead,
        // where it runs once with no customer in scope to reference.
        id: 'lookup',
        copy: 'lookup',
        chain: [
            { target: ADD_FROM(LOOP_NODE, 'bottom'), include: [LOOP_NODE] },
            { target: MAIN('connector') },
            { target: CONNECTOR(TUTORIAL_CONNECTORS[SUPPORT].connectorId) },
            { target: METHOD(SUPPORT, 0) },
        ],
        isDone: progress => progress.methods >= 2,
    },
    {
        id: 'endpoint',
        copy: 'endpoint',
        example: ENDPOINT_EXAMPLE,
        chain: [
            { target: METHOD_NODE(SUPPORT, 0), cue: 'right-click' },
            { target: CONTEXT('edit-url') },
            { target: URL_INSERT_REFERENCE },
            // Once open, the generator is the thing to use — and its list comes with
            // it, or the row would sit undimmed under a dimmed dropdown.
            // The field picker's list counts too, not just the method one: building the
            // path is the second half of the step.
            {
                target: REFERENCE_GENERATOR,
                include: [REFERENCE_POPUP, OPEN_DROPDOWN, METHOD_DIALOG_CLOSE],
            },
            // With the reference in, closing the editor is the only thing left. Shown
            // with the endpoint it went into, so the user can read it before shutting.
            {
                target: METHOD_DIALOG_CLOSE,
                include: [URL_EDITOR],
                when: progress => progress.endpointReference,
            },
        ],
        isDone: progress => progress.endpointReferenceClosed,
    },
    {
        id: 'branch',
        copy: 'branch',
        chain: [
            { target: ADD_FROM(METHOD_NODE(SUPPORT, 0), 'right') },
            { target: MAIN('operator') },
            { target: OPERATOR('if') },
        ],
        isDone: progress => progress.hasIf,
    },
    {
        // Only the IF is pointed at, then the button that adds the comparison. Both
        // sides of it are references, which is the whole lesson of the step.
        id: 'condition',
        copy: 'condition',
        example: CONDITION_EXAMPLE,
        chain: [
            { target: IF_NODE, cue: 'double-click' },
            { target: CONDITION_ADD },
            // Once the row exists, it is the thing to fill in — not the button that
            // made it, which the mask would otherwise keep pointing at.
            { target: CONDITION_RULE, include: [OPEN_DROPDOWN, CONDITION_SAVE] },
        ],
        isDone: progress => progress.ifConditionSaved,
    },
    {
        // Same reasoning as the lookup: the IF's bottom trigger is its true branch.
        id: 'create',
        copy: 'create',
        chain: [
            { target: ADD_FROM(IF_NODE, 'bottom'), include: [IF_NODE] },
            { target: MAIN('connector') },
            { target: CONNECTOR(TUTORIAL_CONNECTORS[SUPPORT].connectorId) },
            { target: METHOD(SUPPORT, 1) },
        ],
        isDone: progress => progress.methods >= 3,
    },
    {
        id: 'username',
        copy: 'username',
        example: USERNAME_EXAMPLE,
        chain: [
            { target: METHOD_NODE(SUPPORT, 1), cue: 'right-click' },
            { target: CONTEXT('edit-body') },
            // The row itself, not its reference icon: that icon only exists while the
            // row is hovered, so it cannot be pointed at before the user goes near it.
            // The row stays the target for both picks, with the picker that opens under
            // it undimmed alongside — pointing at the picker alone let the field being
            // filled fall dark, and the row is what the user has to come back to for
            // the second reference. Superseded only once the enhancement exists, which
            // is to say once both references are in.
            {
                target: BODY_ROW,
                text: 'username',
                cue: 'reference',
                include: [REFERENCE_GENERATOR, REFERENCE_POPUP, OPEN_DROPDOWN],
            },
            // One reference is enough to create an enhancement, so the handover waits
            // for a second: until then the row above stays lit. Its variables sit in a
            // folded panel, so the fold is what to press next.
            { target: VARIABLES_TOGGLE, when: progress => progress.bodyReferencesPaired },
            // Unfolded, the variables are on screen — and this link only resolves then,
            // which is what lets the fold above have its turn first.
            {
                target: VARIABLES,
                include: [ENHANCEMENT_SCRIPT, METHOD_DIALOG_CLOSE],
                when: progress => progress.bodyReferencesPaired,
            },
        ],
        isDone: progress => progress.bodyReferencesClosed,
    },
    /*
     * From here the graph stops changing and the run over it becomes the subject.
     * Every one of these chains opens on the start button: the debug controls exist
     * only while a run is playing, so a user who let the replay drain — it lasts
     * about as long as the graph has steps — is pointed back at the way to start
     * another rather than at a control that is no longer on screen.
     */
    {
        id: 'testrun',
        copy: 'testrun',
        anchor: 'top-right',
        chain: [
            { target: START_BUTTON, include: [START_NODE] },
            // Live is undimmed beside it so the choice reads as a choice, but debug
            // is the one to take: it is the mode the next four steps are about.
            { target: TEST_MODE_DEBUG, include: [TEST_MODE_LIVE] },
        ],
        isDone: progress => progress.testRunStarted,
    },
    {
        id: 'pause',
        copy: 'pause',
        anchor: 'top-right',
        chain: [
            { target: START_BUTTON, include: [START_NODE] },
            { target: PAUSE_BUTTON, include: [SPEED_CONTROL] },
        ],
        isDone: progress => progress.testRunPaused,
    },
    {
        id: 'step',
        copy: 'step',
        anchor: 'top-right',
        chain: [
            { target: START_BUTTON, include: [START_NODE] },
            { target: PAUSE_BUTTON },
            // Only once frozen: the button is disabled while the replay runs, and a
            // disabled control is not something to point a user at.
            { target: STEP_BUTTON, when: progress => progress.testRunPaused },
        ],
        isDone: progress => progress.testRunStepped,
    },
    {
        // The loop's own controls, which it grows only while the replay is paused
        // somewhere inside it — so this step cannot be reached from a drained run
        // without starting and pausing one again, which the chain above allows for.
        id: 'iteration',
        copy: 'iteration',
        anchor: 'top-right',
        chain: [
            { target: START_BUTTON, include: [START_NODE] },
            // Paused before the loop was reached, the controls to use are the replay's
            // own: resume or step until the run is inside it and the icon appears.
            { target: PAUSE_BUTTON, include: [STEP_BUTTON] },
            { target: SKIP_ITERATION, include: [LOOP_NODE, ITERATION_INPUT] },
        ],
        isDone: progress => progress.testRunIterationSkipped,
    },
    {
        // Nothing to detect: a pace is a preference, not a result.
        id: 'speed',
        copy: 'speed',
        anchor: 'top-right',
        chain: [
            { target: START_BUTTON, include: [START_NODE] },
            { target: SPEED_CONTROL, include: [PAUSE_BUTTON, LIVE_TOGGLE] },
        ],
    },
    {
        // The tree outlives the run, so this one keeps its target after the replay
        // has drained — the only test-run step that does.
        id: 'logs',
        copy: 'logs',
        anchor: 'top-right',
        chain: [
            { target: START_BUTTON, include: [START_NODE] },
            { target: LOG_TREE },
        ],
    },
    {
        // Nothing to point at: the graph is finished and this is the read-back.
        id: 'summary',
        copy: 'summary',
        chain: [],
    },
]

/**
 * The step the canvas is asking for: the first one whose result is not on the canvas
 * yet. Derived rather than stored, so placing a node advances the pill by itself —
 * the action *is* the confirmation, and there is no second copy of "where we are" to
 * fall out of step with the graph.
 *
 * Deleting a node therefore steps back, which is intended: the pill always states
 * what is actually missing. The steps that teach dialog configuration have nothing to
 * detect, so they count as done once `acknowledged` has passed them — which is also
 * why the last step is where a finished tutorial settles and waits to be dismissed.
 */
export function resolveStepIndex(progress: CanvasProgress, acknowledged: number): number {
    const pending = TUTORIAL_STEPS.findIndex((step, index) =>
        step.isDone ? !step.isDone(progress) : index >= acknowledged)
    return pending === -1 ? TUTORIAL_STEPS.length - 1 : pending
}

/**
 * The element to highlight right now: the deepest link of the chain that is actually
 * on screen, skipping any whose `when` does not hold yet. Returns null once nothing in
 * the chain is rendered, which is the cue to dim nothing rather than to guess.
 */
export function resolveHighlight(
    chain: TutorialTarget[],
    progress: CanvasProgress,
): TutorialTarget | null {
    for (let i = chain.length - 1; i >= 0; i -= 1) {
        const link = chain[i]
        if (link.when && !link.when(progress)) continue
        if (findVisibleTarget(link.target, link.text)) return link
    }
    return null
}
