import { buildTestId } from '@shared/testing/testId'
import { REFERENCE_POPUP_CLASS } from '@features/workflow/components/method-select/ReferenceMethodSelect'
import { ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'
import { getMethodKey } from '@features/workflow/components/WorkflowSidebar/useWorkflowSidebarItems'
import { TUTORIAL_CONNECTORS } from './tutorialFixtures'
import type { CanvasProgress } from './useCanvasProgress'
import { findVisibleTarget } from './findVisibleTarget'
import type { Shortcut } from '../../ui/ShortcutHint'

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
/**
 * The generator's apply action — the `+` that puts the built reference where it is
 * going. Matched only while it is enabled, which the generator does exactly when a
 * method *and* a field have been chosen: the `:not(:disabled)` is the condition, so
 * the chain narrows onto it by itself and falls back to the whole generator the moment
 * either pick is cleared. No progress flag, because this is a live state rather than
 * something that happened.
 */
const GENERATOR_APPLY = `${sel('workflow-reference-apply')}:not(:disabled)`
/**
 * The path the endpoint step asks for, spelled as the field picker prints it back.
 * Built from the app's own iterator name, so a rename cannot leave the tutorial waiting
 * on a string the picker never produces.
 *
 * Needed because `enabled` is not the same as `finished`: the apply action goes live as
 * soon as *any* field is chosen, and `customers` on its own is a perfectly applicable
 * reference — just not the one being taught. The picker builds the path a segment at a
 * time, so without this the `+` lights up two picks early.
 */
const ENDPOINT_FIELD_PATH = `customers[${ITERATOR_NAMES[0]}].email`
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
/**
 * The header's schedules control and the drawer it raises. The pill renders only for
 * a connection that exists, which on /workflow/create is none — the tutorial supplies
 * a stand-in, see simulatedSchedulesConnection.
 */
const SCHEDULES_PILL = sel('workflow-schedules-pill')
const SCHEDULES_PANEL = sel('workflow-schedules-panel')
const SCHEDULES_ADD = sel('workflow-schedules-add')
/**
 * The create dialog. The title field is what to fill first; the rest of the form is
 * undimmed with it, since the copy explains all three at once and a mask that walked
 * them one by one would spend three steps inside one small dialog.
 */
const SCHEDULE_TITLE = sel(buildTestId('workflow-schedule-title', 'control'))
const SCHEDULE_DEBUG = sel('workflow-schedule-debug')
const SCHEDULE_CRON = sel('workflow-schedule-cron')
const SCHEDULE_SUBMIT = sel('workflow-schedule-submit')
/** A created schedule: the card, the fold on it, and what the fold reveals. */
const SCHEDULE_CARD = '.wf-schedule-card'
const SCHEDULE_CARD_TOGGLE = '[data-testid^="workflow-schedule-toggle-"]'
const SCHEDULE_CARD_DETAILS = '.wf-schedule-card__details'
/**
 * The sidebar's Schedules entry — the same list, across every workflow. Pointed at
 * but never asked for: following it would leave /workflow/create, and the tutorial
 * with it. See the step's own note.
 */
const SCHEDULE_MENU = sel(buildTestId('sidebar-menu', '/schedule'))
/**
 * The header's ⋯ menu, one of its entries, and the drawers two of those entries open.
 * The drawers are mounted from the first paint and parked off-screen, which
 * `findVisibleTarget` already treats as absent — so a panel link resolves exactly
 * while that panel is out.
 */
const HEADER_MENU_BUTTON = sel('workflow-menu')
const HEADER_MENU = '.headerMenu'
const HEADER_MENU_ITEM = (id: 'change-history' | 'version-history') =>
    sel(buildTestId('workflow-menu-item', id))
const CHANGE_HISTORY_PANEL = sel('workflow-change-history-panel')
const CHANGE_HISTORY_CLOSE = sel('workflow-change-history-close')
const VERSION_HISTORY_PANEL = sel('workflow-history-panel')

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
     * Only eligible while something else is on screen showing `text` — a second
     * element the link depends on but does not point at. `when` cannot express this:
     * it reads what has happened, and this is a state the user is still moving through.
     */
    requires?: { target: string; text?: string }
    /**
     * Only eligible while this holds. Visibility alone cannot express a control that
     * becomes the task partway through a step: the request editor's close button is on
     * screen from the moment it opens, but is only what to press once the reference is
     * in — and the generator that put it there closes itself on apply, so without this
     * the highlight falls back to the button that opened it.
     */
    when?: (progress: CanvasProgress) => boolean
}

/**
 * One choice in a sequence the step asks the user to make, in the picker's own words.
 * Two sources, because the options come from two places: a `label` is data — a method
 * or field name out of the fixtures, which is not translated — while a `labelKey`
 * names an option the editor itself renders, resolved against the `workflow` namespace
 * so the pill spells it exactly as the dropdown does, in either language. `values` is
 * for the keys that interpolate, the loop entry's iterator among them.
 */
export type TutorialPick =
    | { label: string; labelKey?: never; values?: never }
    | { labelKey: string; label?: never; values?: Record<string, string> }

export type TutorialStep = {
    id: string
    /**
     * Which corner the copy sits in. Bottom-left by default, which is clear for as
     * long as the work happens in dialogs and the right-hand drawer — but a test run
     * opens the log panel across the bottom of the page, and the pill would then
     * cover the tree it is describing. `center` is for the two steps that book-end
     * the tutorial: neither points at a control, so a middle placement covers nothing
     * either of them is talking about, and centred reads as "this one is about the
     * whole thing" rather than as a hint about something on screen.
     */
    anchor?: 'top-right' | 'center'
    /**
     * A snippet shown under the copy. Lives here rather than in the locale files
     * because it is a code sample, not prose — both languages had it identical, and
     * the endpoint one is generated so it cannot drift from what the app produces.
     */
    example?: string
    /**
     * A sequence of choices, listed under the copy in the order the pickers ask for
     * them. Preferred over spelling them out mid-sentence where the order is the
     * lesson: each pick is what narrows the list the next one is chosen from, and a
     * numbered list says that where "then ... then ..." only implies it.
     */
    picks?: TutorialPick[]
    /**
     * Sample rows of a list the step is describing, in the list's own words. Same shape
     * as `picks`, so a `labelKey` is rendered from the key the editor renders the real
     * row with; bulleted rather than numbered, because these are an illustration of
     * what the list holds, not choices to make in order.
     */
    entries?: TutorialPick[]
    /** Keyboard shortcuts for what the step teaches, shown as keycaps under the copy. */
    shortcuts?: Shortcut[]

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
 * The reference in the lookup's endpoint, as the picks that build it: the method, then
 * the field path one segment at a time. `ITERATOR_NAMES[0]` is the outermost loop's
 * iterator, which is the one on offer here — taking it rather than `[0]` is what ties
 * the reference to the loop instead of pinning it to the first customer.
 */
const ENDPOINT_PICKS: TutorialPick[] = [
    { label: TUTORIAL_CONNECTORS[CRM].invoker.operations[0].name },
    { label: 'customers' },
    { labelKey: 'references.iteratorLoop', values: { iterator: ITERATOR_NAMES[0] } },
    { label: 'email' },
]
/**
 * How a loop is configured, as the four choices that do it: the operator first, then
 * the reference its argument is built from. The method name comes from the fixture, so
 * a rename cannot leave the step describing something that is not in the list; the
 * other two are the editor's own labels — `For`, which is the operator that iterates an
 * array, and the whole array rather than an iterator (that is what the loop hands to
 * the steps inside it) or `[0]`, which would pin every iteration to the first customer.
 */
const LOOP_PICKS: TutorialPick[] = [
    { labelKey: 'conditionBuilder.operators.loop.for' },
    { label: TUTORIAL_CONNECTORS[CRM].invoker.operations[0].name },
    { label: 'customers' },
    { labelKey: 'references.wholeArray' },
]
/**
 * The IF's comparison, written as the two field paths rather than whole references:
 * that is how the dialog's own selects read them back, and the full form would be
 * two 50-character strings in a corner pill. The iterator still comes from the app,
 * so the loop-scoped side cannot drift.
 */
const CONDITION_EXAMPLE = `client.email ≠ customers[${ITERATOR_NAMES[0]}].email`
/** The enhancement's script: two references in, one joined value out. */
export const USERNAME_EXAMPLE = 'RESULT_VAR = VAR_0 + " " + VAR_1'
/**
 * A cron expression in the form the editor stores: six fields, seconds first, and one
 * of the two day fields blanked to `?` as Quartz requires. That last part is what
 * `toQuartzDayRule` does to whatever the visual picker emits, so an example without it
 * would be an expression the app never actually writes.
 */
const CRON_EXAMPLE = '0 0 * * * ?'
/**
 * What the change history holds by the end of the tutorial, newest first as the panel
 * lists it: a sample, not a transcript — the real list has a row for every edit. The
 * method names come from the fixtures, the wording from the panel's own keys.
 */
const CHANGE_HISTORY_ENTRIES: TutorialPick[] = [
    {
        labelKey: 'undoHistory.change.nodeAdded',
        values: { name: TUTORIAL_CONNECTORS[SUPPORT].invoker.operations[1].name },
    },
    {
        labelKey: 'undoHistory.change.methodUrl',
        values: { name: TUTORIAL_CONNECTORS[SUPPORT].invoker.operations[0].name },
    },
    { labelKey: 'undoHistory.change.initial' },
]
/** The editor's undo bindings — see useWorkflowUndoShortcuts. */
const UNDO_SHORTCUTS: Shortcut[] = [
    { combos: [['mod', 'z']], labelKey: 'actions.undo' },
    { combos: [['mod', 'shift', 'z'], ['mod', 'y']], labelKey: 'actions.redo' },
]

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
        picks: LOOP_PICKS,
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
        picks: ENDPOINT_PICKS,
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
            // Both picks made, so the reference exists but is not anywhere yet: the
            // whole row stops being the instruction and the `+` that commits it starts.
            // It is a borderless text-weight glyph at the end of the row, which is
            // exactly the thing a user reads past — the step stalls there otherwise.
            //
            // Nothing undimmed alongside it, deliberately: the row is what the previous
            // link lights, and carrying it over here would put the cut-out back around
            // the whole thing and say nothing about where to press. The picks have been
            // made and read by this point; the one glyph left is the instruction.
            {
                target: GENERATOR_APPLY,
                requires: { target: REFERENCE_GENERATOR, text: ENDPOINT_FIELD_PATH },
            },
            // With the reference in, closing the editor is the only thing left. Shown
            // with the endpoint it went into, so the user can read it before shutting —
            // and the generator has closed itself by now, so this is also what takes
            // over from the `+` above.
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
     * The two ways back, taught once the graph is finished and before the run over it:
     * this is the point where there is a session's worth of edits to look through.
     * Both are read rather than used — a jump in the change history takes nodes off
     * the canvas, which the steps above are counting, and would send the tutorial back
     * to the step that built what went missing. The version history lists samples
     * (see tutorialVersions), which select but never load.
     */
    {
        id: 'changeHistory',
        copy: 'changeHistory',
        entries: CHANGE_HISTORY_ENTRIES,
        shortcuts: UNDO_SHORTCUTS,
        chain: [
            { target: HEADER_MENU_BUTTON },
            { target: HEADER_MENU_ITEM('change-history'), include: [HEADER_MENU] },
            { target: CHANGE_HISTORY_PANEL },
        ],
    },
    {
        id: 'versionHistory',
        copy: 'versionHistory',
        chain: [
            { target: HEADER_MENU_BUTTON },
            { target: HEADER_MENU_ITEM('version-history'), include: [HEADER_MENU] },
            // Still open from the step before, the change history's overlay would take
            // the click meant for the menu button — so its close comes first. Placed
            // deeper than the menu entry, which cannot be on screen at the same time.
            { target: CHANGE_HISTORY_CLOSE, include: [CHANGE_HISTORY_PANEL] },
            { target: VERSION_HISTORY_PANEL },
        ],
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
    /*
     * A test run proves the graph; a schedule is what makes it run without anyone
     * watching. These three stay on the header's schedules pill as their first link,
     * for the same reason the test-run steps stay on the start button: the drawer is
     * something the user closes to see the canvas again, and the way back in is the
     * pill rather than whatever was inside it.
     */
    {
        id: 'schedules',
        copy: 'schedules',
        chain: [{ target: SCHEDULES_PILL }],
        isDone: progress => progress.schedulesOpened,
    },
    {
        id: 'schedule',
        copy: 'schedule',
        example: CRON_EXAMPLE,
        chain: [
            { target: SCHEDULES_PILL },
            { target: SCHEDULES_ADD, include: [SCHEDULES_PANEL] },
            // The dialog supersedes the button that opened it, or the mask would keep
            // pointing back into the drawer behind it.
            { target: SCHEDULE_TITLE, include: [SCHEDULE_DEBUG, SCHEDULE_CRON, SCHEDULE_SUBMIT] },
        ],
        isDone: progress => progress.scheduleCreated,
    },
    {
        // Nothing to detect past the fold: reading a card is not a result.
        id: 'scheduleCard',
        copy: 'scheduleCard',
        chain: [
            { target: SCHEDULES_PILL },
            { target: SCHEDULE_CARD_TOGGLE, include: [SCHEDULE_CARD] },
            // Only once open — before that the fold above is still the thing to press,
            // and this link resolves to nothing anyway.
            { target: SCHEDULE_CARD_DETAILS, include: [SCHEDULE_CARD] },
        ],
    },
    {
        // The one step that points outside the editor. No `isDone`, and deliberately
        // no cue: taking this link would navigate away from /workflow/create and end
        // the tutorial, so the copy and the note both say to look rather than click.
        id: 'scheduleList',
        copy: 'scheduleList',
        chain: [{ target: SCHEDULE_MENU }],
    },
    {
        // Nothing to point at: the graph is finished and this is the read-back. Centred
        // like the introduction it answers, and blocking for the same reason — with no
        // chain there is no cut-out, and a stray click on the canvas behind would delete
        // a node and send the pill back to the step that asks for it.
        id: 'summary',
        copy: 'summary',
        anchor: 'center',
        chain: [],
    },
]

/**
 * The step the canvas is asking for: the first one at or after `floor` whose result is
 * not on the canvas yet. Derived rather than stored, so placing a node advances the
 * pill by itself — the action *is* the confirmation, and there is no second copy of
 * "where we are" to fall out of step with the graph.
 *
 * Deleting a node therefore steps back, which is intended: the pill always states
 * what is actually missing. The steps that teach dialog configuration have nothing to
 * detect, so they count as done once `acknowledged` has passed them — which is also
 * why the last step is where a finished tutorial settles and waits to be dismissed.
 *
 * `floor` is how the query-string jump works (see `resolveStepFloor`): the steps
 * before it are skipped rather than faked, so no progress has to be invented for a
 * graph that was never built, and everything from the floor on behaves exactly as it
 * does in a full run.
 */
export function resolveStepIndex(
    progress: CanvasProgress,
    acknowledged: number,
    floor = 0,
): number {
    const pending = TUTORIAL_STEPS.findIndex((step, index) =>
        index >= floor && (step.isDone ? !step.isDone(progress) : index >= acknowledged))
    return pending === -1 ? TUTORIAL_STEPS.length - 1 : pending
}

/**
 * Names the step to open on, by id or by the number the pill's counter shows:
 * `/workflow/create?tutorialStep=schedules`, `/workflow/create?tutorialStep=10`.
 */
export const TUTORIAL_STEP_PARAM = 'tutorialStep'

/**
 * The step a URL asks the tutorial to open on, or null for a normal run from the top.
 *
 * Exists for trying a late step without building the whole graph and sitting through a
 * replay first — the scheduling steps are eleven actions in. Development only: the
 * caller (WorkflowTutorial) skips it outside `import.meta.env.DEV`, so a production
 * build never reads the parameter.
 *
 * A number is read 1-based, as the counter prints it, so the step a tester sees as
 * "10 / 23" is `?tutorialStep=10`. Ids stay the stable form: numbers shift whenever a
 * step is added before them.
 *
 * An unknown name or an out-of-range number is ignored rather than refused. The
 * fallback is the tutorial opening at the beginning, which is where it opens anyway.
 */
export function resolveStepFloor(search: string): number | null {
    const value = new URLSearchParams(search).get(TUTORIAL_STEP_PARAM)
    if (!value) return null
    if (/^\d+$/.test(value)) {
        const position = Number(value)
        return position >= 1 && position <= TUTORIAL_STEPS.length ? position - 1 : null
    }
    const index = TUTORIAL_STEPS.findIndex(step => step.id === value)
    return index === -1 ? null : index
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
        if (link.requires && !findVisibleTarget(link.requires.target, link.requires.text)) continue
        if (findVisibleTarget(link.target, link.text)) return link
    }
    return null
}
