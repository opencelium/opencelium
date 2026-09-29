import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { getReferenceDisplayLabel } from '@features/workflow/components/request-editor/shared/referenceDisplay'
import { ENDPOINT_REFERENCE_CLASS } from '@features/workflow/components/request-editor/url-editor/UrlEndpointField/urlEndpointField.utils'
import { ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'
import { resetCanvasProgress, useCanvasProgress } from './useCanvasProgress'

/** Real nodes render inside the canvas, so the fixture puts them there too. */
const addNode = (type: string) => {
    const node = document.createElement('div')
    node.className = `react-flow__node react-flow__node-${type}`
    ;(document.querySelector('.react-flow') ?? document.body).appendChild(node)
    return node
}

/** The editor route is lazy loaded, so the canvas appears after the tutorial activates. */
const mountCanvas = () => {
    const canvas = document.createElement('div')
    canvas.className = 'react-flow'
    document.body.appendChild(canvas)
    return canvas
}

/** The dialog's primary action; a configured operator looks like an unconfigured one. */
const saveButton = () => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'workflow-condition-save')
    document.body.appendChild(button)
    return button
}

/** A loop's comparison row, which is what tells the two conditions apart. */
const showLoopRule = () => {
    const row = document.createElement('div')
    row.className = 'conditionRule conditionRuleLoop'
    row.getBoundingClientRect = () => ({
        width: 400, height: 40, top: 0, left: 0, right: 400, bottom: 40, x: 0, y: 0,
        toJSON: () => ({}),
    })
    document.body.appendChild(row)
    return row
}

/**
 * The URL editor showing a reference pill. Its label is built by the app's own
 * formatter, so a change to that format fails here rather than silently stopping the
 * tutorial from ever advancing.
 */
const urlEditorWithReference = (reference: string) => {
    const editor = document.createElement('div')
    editor.setAttribute('data-testid', 'workflow-url-editor')
    const pill = document.createElement('span')
    pill.className = ENDPOINT_REFERENCE_CLASS
    pill.textContent = getReferenceDisplayLabel(reference)
    editor.appendChild(pill)
    document.body.appendChild(editor)
    return editor
}

/** The request editor's close control. */
const closeMethodDialog = () => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'workflow-method-dialog-close')
    document.body.appendChild(button)
    button.click()
    return button
}

/**
 * The enhancement's delete action. Enabled means one reference — enough to create the
 * enhancement, not enough for the step — disabled means two or more.
 */
const showEnhancement = ({ paired }: { paired: boolean }) => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'workflow-enhancement-delete')
    button.disabled = paired
    button.getBoundingClientRect = () => ({
        width: 24, height: 24, top: 0, left: 0, right: 24, bottom: 24, x: 0, y: 0,
        toJSON: () => ({}),
    })
    document.body.appendChild(button)
    return button
}

/**
 * The schedules drawer, mounted and laid out but parked off to the right — which is how
 * the editor renders it from the first paint, open or not.
 */
const mountSchedulesDrawer = () => {
    const panel = document.createElement('aside')
    panel.setAttribute('data-testid', 'workflow-schedules-panel')
    panel.className = 'rightDrawer wf-schedules-drawer'
    panel.getBoundingClientRect = () => ({
        width: 300, height: 600, top: 0, left: 0, right: 300, bottom: 600, x: 0, y: 0,
        toJSON: () => ({}),
    })
    document.body.appendChild(panel)
    return panel
}

const iterator = ITERATOR_NAMES[0]
const LOOP_SCOPED_REFERENCE = `#a1b2c3.(response).body.$.customers[${iterator}].email`
const FIXED_REFERENCE = '#a1b2c3.(response).body.$.customers[0].email'

describe('useCanvasProgress', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        resetCanvasProgress()
    })

    it('reports nothing while inactive, even with nodes on the canvas', () => {
        mountCanvas()
        addNode('connector')
        const { result } = renderHook(() => useCanvasProgress(false))
        expect(result.current).toEqual({
            methods: 0, hasLoop: false, hasIf: false,
            loopConditionSaved: false, ifConditionSaved: false,
            endpointReference: false, endpointReferenceClosed: false,
            bodyReferencesPaired: false, bodyReferencesClosed: false,
            testRunStarted: false, testRunPaused: false,
            testRunStepped: false, testRunIterationSkipped: false,
            schedulesOpened: false, scheduleCreated: false,
        })
    })

    /*
     * The regression: opening the drawer changes nothing but a class on an element that
     * was already mounted, so an observer watching children alone never fired and the
     * step asking for it could not be completed — the mask sat on the pill the drawer
     * had just covered up.
     */
    it('sees the schedules drawer open, which is only a class away', async () => {
        mountCanvas()
        const panel = mountSchedulesDrawer()
        const { result } = renderHook(() => useCanvasProgress(true))
        expect(result.current.schedulesOpened).toBe(false)

        panel.classList.add('rightDrawerOpen')

        await waitFor(() => expect(result.current.schedulesOpened).toBe(true))
    })

    // Latched, because the drawer is something the user closes again to get at the
    // canvas — a step that un-completed itself there would send them straight back in.
    it('keeps the drawer counted as opened after it is closed again', async () => {
        mountCanvas()
        const panel = mountSchedulesDrawer()
        const { result } = renderHook(() => useCanvasProgress(true))

        panel.classList.add('rightDrawerOpen')
        await waitFor(() => expect(result.current.schedulesOpened).toBe(true))

        panel.classList.remove('rightDrawerOpen')
        await waitFor(() => expect(result.current.schedulesOpened).toBe(true))
    })

    it('counts a schedule once its card is in the drawer', async () => {
        mountCanvas()
        const panel = mountSchedulesDrawer()
        const { result } = renderHook(() => useCanvasProgress(true))
        expect(result.current.scheduleCreated).toBe(false)

        const card = document.createElement('div')
        card.className = 'wf-schedule-card'
        card.getBoundingClientRect = () => ({
            width: 268, height: 40, top: 0, left: 0, right: 268, bottom: 40, x: 0, y: 0,
            toJSON: () => ({}),
        })
        panel.appendChild(card)

        await waitFor(() => expect(result.current.scheduleCreated).toBe(true))
    })

    it('reads what is already on the canvas on the first render', () => {
        mountCanvas()
        addNode('connector')
        addNode('connector')
        const { result } = renderHook(() => useCanvasProgress(true))
        expect(result.current.methods).toBe(2)
    })

    // The regression: the canvas did not exist when the tutorial activated, so an
    // observer scoped to it attached to nothing and never retried — leaving `methods`
    // at 0 for good and the pill's Next button permanently disabled.
    it('counts a method added after the canvas mounts late', async () => {
        const { result } = renderHook(() => useCanvasProgress(true))
        expect(result.current.methods).toBe(0)

        mountCanvas()
        addNode('connector')

        await waitFor(() => expect(result.current.methods).toBe(1))
    })

    it('tracks further methods and operators as they are added', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))

        addNode('connector')
        await waitFor(() => expect(result.current.methods).toBe(1))

        addNode('connector')
        await waitFor(() => expect(result.current.methods).toBe(2))

        // Kept apart, because the scenario wants a loop at one step and an IF later.
        expect(result.current.hasLoop).toBe(false)
        expect(result.current.hasIf).toBe(false)
        addNode('loop')
        await waitFor(() => expect(result.current.hasLoop).toBe(true))
        expect(result.current.hasIf).toBe(false)

        addNode('if')
        await waitFor(() => expect(result.current.hasIf).toBe(true))
    })

    // Attribution comes from the row on screen, so the two conditions cannot be
    // confused and re-saving one cannot satisfy the other's step.
    it('credits a save to the loop when a loop row is on screen', async () => {
        mountCanvas()
        const row = showLoopRule()
        const { result } = renderHook(() => useCanvasProgress(true))

        saveButton().click()

        await waitFor(() => expect(result.current.loopConditionSaved).toBe(true))
        expect(result.current.ifConditionSaved).toBe(false)
        row.remove()
    })

    it('credits a save to the IF when no loop row is on screen', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))

        saveButton().click()

        await waitFor(() => expect(result.current.ifConditionSaved).toBe(true))
        expect(result.current.loopConditionSaved).toBe(false)
    })

    it('does not let a second loop save stand in for the IF', async () => {
        mountCanvas()
        showLoopRule()
        const { result } = renderHook(() => useCanvasProgress(true))

        saveButton().click()
        saveButton().click()

        await waitFor(() => expect(result.current.loopConditionSaved).toBe(true))
        expect(result.current.ifConditionSaved).toBe(false)
    })

    it('credits a save made from inside the button, not only on it', async () => {
        mountCanvas()
        const button = saveButton()
        const label = document.createElement('span')
        button.appendChild(label)
        const { result } = renderHook(() => useCanvasProgress(true))

        label.click()

        await waitFor(() => expect(result.current.ifConditionSaved).toBe(true))
    })

    it('ignores clicks on anything else', async () => {
        mountCanvas()
        const other = document.createElement('button')
        document.body.appendChild(other)
        const { result } = renderHook(() => useCanvasProgress(true))

        other.click()

        await new Promise(resolve => setTimeout(resolve, 30))
        expect(result.current.ifConditionSaved).toBe(false)
        expect(result.current.loopConditionSaved).toBe(false)
    })

    // Otherwise a restarted tutorial opens with the loop step already satisfied.
    it('forgets counted saves when reset', async () => {
        mountCanvas()
        const { result, rerender } = renderHook(
            ({ active }: { active: boolean }) => useCanvasProgress(active),
            { initialProps: { active: true } },
        )
        saveButton().click()
        await waitFor(() => expect(result.current.ifConditionSaved).toBe(true))

        resetCanvasProgress()
        rerender({ active: false })
        rerender({ active: true })

        await waitFor(() => expect(result.current.ifConditionSaved).toBe(false))
        expect(result.current.loopConditionSaved).toBe(false)
        expect(result.current.endpointReference).toBe(false)
        expect(result.current.endpointReferenceClosed).toBe(false)
    })

    it('notices a loop-scoped reference reaching the endpoint', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))
        expect(result.current.endpointReference).toBe(false)

        urlEditorWithReference(LOOP_SCOPED_REFERENCE)

        await waitFor(() => expect(result.current.endpointReference).toBe(true))
    })

    // [0] resolves to the same customer every time round, so it is not the lesson.
    it('ignores a reference pinned to a fixed element', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))

        urlEditorWithReference(FIXED_REFERENCE)

        await new Promise(resolve => setTimeout(resolve, 30))
        expect(result.current.endpointReference).toBe(false)
    })

    // The pill only exists while the dialog is open; the step must not come undone.
    it('keeps the reference once the editor closes again', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))
        const editor = urlEditorWithReference(LOOP_SCOPED_REFERENCE)
        await waitFor(() => expect(result.current.endpointReference).toBe(true))

        editor.remove()

        await new Promise(resolve => setTimeout(resolve, 30))
        expect(result.current.endpointReference).toBe(true)
    })

    // The dialog covers the canvas the next step points at, so the step waits for it
    // to be shut rather than moving on the moment the reference lands.
    it('commits the reference only when the editor is closed', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))
        urlEditorWithReference(LOOP_SCOPED_REFERENCE)
        await waitFor(() => expect(result.current.endpointReference).toBe(true))
        expect(result.current.endpointReferenceClosed).toBe(false)

        closeMethodDialog()

        await waitFor(() => expect(result.current.endpointReferenceClosed).toBe(true))
    })

    // Otherwise opening the editor and shutting it again would satisfy the step.
    it('ignores a close with no reference in the endpoint', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))

        closeMethodDialog()

        await new Promise(resolve => setTimeout(resolve, 30))
        expect(result.current.endpointReferenceClosed).toBe(false)
    })

    it('ignores a close over a reference pinned to a fixed element', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))
        urlEditorWithReference(FIXED_REFERENCE)

        closeMethodDialog()

        await new Promise(resolve => setTimeout(resolve, 30))
        expect(result.current.endpointReferenceClosed).toBe(false)
    })

    // Two references in one field make the app wrap them in an enhancement by itself,
    // so the script editor showing up is the evidence both went in.
    it('waits for the second reference, not merely for an enhancement', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))

        // one reference: an enhancement exists, but its delete action is still offered
        const single = showEnhancement({ paired: false })
        await new Promise(resolve => setTimeout(resolve, 30))
        expect(result.current.bodyReferencesPaired).toBe(false)
        single.remove()

        showEnhancement({ paired: true })

        await waitFor(() => expect(result.current.bodyReferencesPaired).toBe(true))
        expect(result.current.bodyReferencesClosed).toBe(false)

        closeMethodDialog()

        await waitFor(() => expect(result.current.bodyReferencesClosed).toBe(true))
    })

    it('does not confuse closing the url editor with closing the body one', async () => {
        mountCanvas()
        const { result } = renderHook(() => useCanvasProgress(true))
        urlEditorWithReference(LOOP_SCOPED_REFERENCE)
        await waitFor(() => expect(result.current.endpointReference).toBe(true))

        closeMethodDialog()

        await waitFor(() => expect(result.current.endpointReferenceClosed).toBe(true))
        // no enhancement was on screen, so the body step is untouched
        expect(result.current.bodyReferencesClosed).toBe(false)
    })

    it('pins the label format the reference check relies on', () => {
        expect(getReferenceDisplayLabel(LOOP_SCOPED_REFERENCE)).toContain(`[${iterator}]`)
        expect(getReferenceDisplayLabel(FIXED_REFERENCE)).not.toContain(`[${iterator}]`)
    })

    it('notices a method removed again', async () => {
        mountCanvas()
        const node = addNode('connector')
        const { result } = renderHook(() => useCanvasProgress(true))
        expect(result.current.methods).toBe(1)

        node.remove()
        await waitFor(() => expect(result.current.methods).toBe(0))
    })
})
