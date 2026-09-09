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
}

const INACTIVE: CanvasProgress = {
    methods: 0, hasLoop: false, hasIf: false,
    loopConditionSaved: false, ifConditionSaved: false,
    endpointReference: false, endpointReferenceClosed: false,
    bodyReferencesPaired: false, bodyReferencesClosed: false,
}

let loopConditionSaved = false
let ifConditionSaved = false
let endpointReference = false
let endpointReferenceClosed = false
let bodyReferencesPaired = false
let bodyReferencesClosed = false

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
        || bodyReferencesClosed !== snapshot.bodyReferencesClosed) {
        snapshot = {
            methods, hasLoop, hasIf, loopConditionSaved, ifConditionSaved,
            endpointReference, endpointReferenceClosed,
            bodyReferencesPaired, bodyReferencesClosed,
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
 */
const subscribe = (onChange: () => void) => {
    // Latched here rather than in getSnapshot, which has to stay a plain read: the
    // pill is written with innerHTML, so its arrival is always a mutation.
    const observer = new MutationObserver(() => {
        if (!endpointReference && readEndpointReference()) endpointReference = true
        if (!bodyReferencesPaired && readPairedReferences()) bodyReferencesPaired = true
        onChange()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const onClick = (event: MouseEvent) => {
        const target = event.target
        if (!(target instanceof Element)) return
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
