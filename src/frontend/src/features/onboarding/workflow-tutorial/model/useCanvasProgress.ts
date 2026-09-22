import { useSyncExternalStore } from 'react'
import { ENDPOINT_REFERENCE_CLASS } from '@features/workflow/components/request-editor/url-editor/UrlEndpointField/urlEndpointField.utils'
import { ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'

/** @xyflow/react renders every node as `.react-flow__node-<type>`; see workflowCanvasTypes. */
const NODE = (type: string) => `.react-flow__node-${type}`
/** The condition dialog's primary action, for both loop and IF operators. */
const CONDITION_SAVE = '[data-testid="workflow-condition-save"]'
/** A loop's comparison row wears this; an IF's does not. See ConditionBuilder. */
const LOOP_RULE = '.conditionRuleLoop'
/** The request editor's own close control; pressing it is what commits the edit. */
const METHOD_DIALOG_CLOSE = '[data-testid="workflow-method-dialog-close"]'
/**
 * The enhancement's delete action, which is disabled exactly when the field holds more
 * than one reference: `canDelete = countEnhancementReferences(enhancement) <= 1` in
 * Enhancement. That makes its disabled state the tutorial's evidence that *both*
 * firstName and lastName went in.
 *
 * The script editor is no good for this — one reference is already enough to create an
 * enhancement, so it appears after the first pick and the tutorial moved on too early.
 * (`disabled` is also set in read-only mode, which the tutorial never runs in.)
 */
const ENHANCEMENT_DELETE = '[data-testid="workflow-enhancement-delete"]'
/** A reference already inserted into the endpoint, rendered as an inline pill. */
const ENDPOINT_REFERENCE = `[data-testid="workflow-url-editor"] .${ENDPOINT_REFERENCE_CLASS}`
/** The outermost loop's variable, as the pill's label spells it: `B:customers[i].email`. */
const LOOP_SCOPED = `[${ITERATOR_NAMES[0]}]`
/**
 * The start button while a run is on. Taken from the button's own running shape
 * rather than from the debug panel, which a run started in live mode never renders —
 * "a test run happened" has to be true in both modes.
 */
const RUNNING_START = '.startNodeRunning'
/** The replay debugger's controls. Clicking them is the only evidence they were used:
 *  a resumed replay looks exactly like one that was never paused. */
const PAUSE_BUTTON = '[data-testid="workflow-test-pause-button"]'
const STEP_BUTTON = '[data-testid="workflow-test-step-forward-button"]'
/** A loop node's "jump past the rest of this iteration" control; prefixed with its id. */
const SKIP_ITERATION = '[data-testid^="workflow-node-skip-iteration-"]'
/**
 * The schedules drawer while it is out. The open class is part of the selector
 * because the drawer is mounted either way, parked at `translateX(100%)` — a plain
 * presence check would read as open from the moment the editor renders.
 */
const SCHEDULES_PANEL_OPEN = '[data-testid="workflow-schedules-panel"].rightDrawerOpen'
/** One schedule in that drawer. */
const SCHEDULE_CARD = '.wf-schedule-card'

export type CanvasProgress = {
    /** Connector-method nodes the user has placed. */
    methods: number
    /** Kept apart: the scenario asks for a loop first and an IF later, so one
     *  "an operator exists" flag would let either satisfy either step. */
    hasLoop: boolean
    hasIf: boolean
    /**
     * Whether each operator's condition has been saved. Taken from the click rather
     * than read off the canvas: a configured operator looks exactly like an
     * unconfigured one — its condition lives in node data, and the node renders only
     * the word "loop" either way.
     *
     * Attributed per kind rather than counted, so re-saving the loop's condition
     * cannot satisfy the IF's step and the two can be done in any order.
     */
    loopConditionSaved: boolean
    ifConditionSaved: boolean
    /**
     * Whether a loop-scoped reference has been put into the endpoint. Latched, like
     * `conditionSaves`: the pill lives in the URL editor, so closing the dialog would
     * otherwise undo the step. Requires the iterator in the path — `[0]` or `[*]`
     * would resolve to the same customer every time round.
     */
    endpointReference: boolean
    /**
     * Whether the request editor was closed with that reference in place. Ordered
     * deliberately: a close counted on its own would fire for a dialog the user only
     * looked at, and the reference on its own moves the tutorial on while the dialog
     * is still covering the canvas it wants to point at next.
     */
    endpointReferenceClosed: boolean
    /** A body field holds two references, joined by an enhancement. */
    bodyReferencesPaired: boolean
    /** ...and the request editor was closed with them in place. */
    bodyReferencesClosed: boolean
    /**
     * Whether a test run has been started. Latched from the start button's running
     * shape rather than read live: the run ends on its own, and a step that asked for
     * one would otherwise un-complete itself the moment the replay drained.
     */
    testRunStarted: boolean
    /**
     * The replay debugger's three gestures, each taken from the click. None of them
     * leaves a trace to read afterwards — a resumed replay is indistinguishable from
     * one that was never paused, and an iteration jumped to looks like one reached
     * by waiting.
     */
    testRunPaused: boolean
    testRunStepped: boolean
    testRunIterationSkipped: boolean
    /**
     * The schedules drawer was opened. Latched like the rest: the panel is a drawer
     * the user closes again to get at the canvas, and a step that un-completed itself
     * on the way out would send them straight back into it.
     */
    schedulesOpened: boolean
    /** A schedule exists for this workflow. Read from the drawer's contents, which
     *  unmount with it — hence latched too. */
    scheduleCreated: boolean
}

const INACTIVE: CanvasProgress = {
    methods: 0, hasLoop: false, hasIf: false,
    loopConditionSaved: false, ifConditionSaved: false,
    endpointReference: false, endpointReferenceClosed: false,
    bodyReferencesPaired: false, bodyReferencesClosed: false,
    testRunStarted: false, testRunPaused: false,
    testRunStepped: false, testRunIterationSkipped: false,
    schedulesOpened: false, scheduleCreated: false,
}

let loopConditionSaved = false
let ifConditionSaved = false
let endpointReference = false
let endpointReferenceClosed = false
let bodyReferencesPaired = false
let bodyReferencesClosed = false
let testRunStarted = false
let testRunPaused = false
let testRunStepped = false
let testRunIterationSkipped = false
let schedulesOpened = false
let scheduleCreated = false

const readPairedReferences = () => {
    const remove = findVisible(ENHANCEMENT_DELETE)
    return !!remove && remove.matches(':disabled')
}

/** True while the endpoint field is showing a reference scoped to the loop. */
const readEndpointReference = () =>
    Array.from(document.querySelectorAll(ENDPOINT_REFERENCE))
        .some(pill => (pill.textContent ?? '').includes(LOOP_SCOPED))

/** Present and laid out, which is all these latches need to know. */
const findVisible = (selector: string) => {
    const element = document.querySelector<HTMLElement>(selector)
    if (!element) return null
    const { width, height } = element.getBoundingClientRect()
    return width > 0 || height > 0 ? element : null
}

/**
 * Cached so repeated snapshot reads return an identical object — `useSyncExternalStore`
 * re-reads on every render and would loop forever on a fresh one each time. The cache
 * is module level because the thing it mirrors, the document, is global too.
 */
let snapshot: CanvasProgress = INACTIVE

const getSnapshot = (): CanvasProgress => {
    const methods = document.querySelectorAll(NODE('connector')).length
    const hasLoop = document.querySelector(NODE('loop')) !== null
    const hasIf = document.querySelector(NODE('if')) !== null
    if (methods !== snapshot.methods || hasLoop !== snapshot.hasLoop
        || hasIf !== snapshot.hasIf
        || loopConditionSaved !== snapshot.loopConditionSaved
        || ifConditionSaved !== snapshot.ifConditionSaved
        || endpointReference !== snapshot.endpointReference
        || endpointReferenceClosed !== snapshot.endpointReferenceClosed
        || bodyReferencesPaired !== snapshot.bodyReferencesPaired
        || bodyReferencesClosed !== snapshot.bodyReferencesClosed
        || testRunStarted !== snapshot.testRunStarted
        || testRunPaused !== snapshot.testRunPaused
        || testRunStepped !== snapshot.testRunStepped
        || testRunIterationSkipped !== snapshot.testRunIterationSkipped
        || schedulesOpened !== snapshot.schedulesOpened
        || scheduleCreated !== snapshot.scheduleCreated) {
        snapshot = {
            methods, hasLoop, hasIf, loopConditionSaved, ifConditionSaved,
            endpointReference, endpointReferenceClosed,
            bodyReferencesPaired, bodyReferencesClosed,
            testRunStarted, testRunPaused, testRunStepped, testRunIterationSkipped,
            schedulesOpened, scheduleCreated,
        }
    }
    return snapshot
}

const getInactiveSnapshot = () => INACTIVE

/**
 * Watches the whole document rather than the canvas element. The editor route is lazy
 * loaded, so `.react-flow` does not exist yet at the moment the tutorial activates —
 * an observer scoped to it then would attach to nothing and, having only `active` to
 * react to, never retry. React Flow can also replace that element on remount, which
 * would strand a canvas-scoped observer on a detached node.
 *
 * The click listener is capture-phase and on the document, so it sees the save before
 * the dialog closes and takes the button with it.
 *
 * Attributes are watched as well as children, because several of these signals are a
 * class or a disabled flag flipping on an element that is already mounted and does not
 * otherwise change: the schedules drawer slides in on `rightDrawerOpen` alone, the
 * start button gains `startNodeRunning`, and the enhancement's delete action goes
 * disabled on the second reference. Those three used to be caught only by whatever
 * children happened to change alongside them — which for the drawer is nothing, since
 * it is mounted and rendered from the first paint and merely parked off-screen.
 */
const subscribe = (onChange: () => void) => {
    // Latched here rather than in getSnapshot, which has to stay a plain read: the
    // pill is written with innerHTML, so its arrival is always a mutation.
    const observer = new MutationObserver(() => {
        // Cheap enough to re-read on every batch: the tutorial already resolves its
        // highlight on an animation frame, which queries the document far more often.
        if (!endpointReference && readEndpointReference()) endpointReference = true
        if (!bodyReferencesPaired && readPairedReferences()) bodyReferencesPaired = true
        if (!testRunStarted && findVisible(RUNNING_START)) testRunStarted = true
        // The drawer is a class away from open, and its cards arrive with the refetch
        // the create triggers — neither has a click of its own to latch on.
        if (!schedulesOpened && findVisible(SCHEDULES_PANEL_OPEN)) schedulesOpened = true
        if (!scheduleCreated && findVisible(SCHEDULE_CARD)) scheduleCreated = true
        onChange()
    })
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        // Only what the latches above actually read. Left unfiltered this would also
        // fire on every `style` React Flow writes while a node is being dragged.
        attributeFilter: ['class', 'disabled'],
    })

    const onClick = (event: MouseEvent) => {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest(PAUSE_BUTTON)) {
            // Pause and resume share one button, so this latches on either — the step
            // asks the user to freeze the replay, and the freeze is what they saw.
            testRunPaused = true
            onChange()
            return
        }
        // A disabled button emits no click, so reaching here means a line really was
        // applied rather than the user pressing a greyed-out control.
        if (target.closest(STEP_BUTTON)) {
            testRunStepped = true
            onChange()
            return
        }
        if (target.closest(SKIP_ITERATION)) {
            testRunIterationSkipped = true
            onChange()
            return
        }
        if (target.closest(CONDITION_SAVE)) {
            // Which operator's condition this is decided by the row on screen behind
            // the button, not by how many saves have happened.
            if (findVisible(LOOP_RULE)) loopConditionSaved = true
            else ifConditionSaved = true
            onChange()
            return
        }
        // Read the DOM again as well as trusting the latch: the pill is still on screen
        // at this point, and the observer may not have run for a reference inserted a
        // moment ago.
        if (!target.closest(METHOD_DIALOG_CLOSE)) return
        // One close button serves both request editors, so which edit it commits is
        // decided by what is on screen behind it.
        if (endpointReference || readEndpointReference()) {
            endpointReference = true
            endpointReferenceClosed = true
        }
        if (bodyReferencesPaired || readPairedReferences()) {
            bodyReferencesPaired = true
            bodyReferencesClosed = true
        }
        onChange()
    }
    document.addEventListener('click', onClick, true)

    return () => {
        observer.disconnect()
        document.removeEventListener('click', onClick, true)
    }
}

const noSubscription = () => () => {}

/** Forgets the latched signals, so a restarted tutorial does not begin half-done. */
export function resetCanvasProgress(): void {
    loopConditionSaved = false
    ifConditionSaved = false
    endpointReference = false
    endpointReferenceClosed = false
    bodyReferencesPaired = false
    bodyReferencesClosed = false
    testRunStarted = false
    testRunPaused = false
    testRunStepped = false
    testRunIterationSkipped = false
    schedulesOpened = false
    scheduleCreated = false
}

/**
 * What the user has actually built, read from the rendered canvas rather than from the
 * editor's state. The graph lives in `useNodesState` inside the editor's own route
 * component, so there is nothing to subscribe to from out here — and reading the DOM
 * keeps the tutorial from reaching into the workflow feature's internals.
 *
 * The node classes are @xyflow/react's own, so they are as stable as the library.
 */
export function useCanvasProgress(active: boolean): CanvasProgress {
    return useSyncExternalStore(
        active ? subscribe : noSubscription,
        active ? getSnapshot : getInactiveSnapshot,
    )
}
