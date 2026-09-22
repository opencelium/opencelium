import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@features/auth/useIsAdmin', () => ({ useIsAdmin: () => true }))
// The dim picks its colour from the active theme; the provider is not what these
// scenarios are about.
vi.mock('@shared/theme/hooks/useTheme', () => ({ useTheme: () => ({ themeMode: 'light' }) }))
vi.mock('./TutorialSpotlight', () => ({ TutorialSpotlight: () => null }))
// The real pill pulls in i18n and the primitive adapters; what matters here is which
// step it is showing and whether it offers a way out.
vi.mock('./TutorialPill', () => ({
    TutorialPill: ({ index, total, onNext, onClose }: {
        index: number; total: number; onNext?: () => void; onClose: () => void
    }) => (
        <div>
            <span data-testid="step">{index}</span>
            {/* Exit is offered on every step; the mock mirrors that. */}
            <button data-testid="exit" onClick={onClose}>exit</button>
            {onNext && <button data-testid="next" onClick={onNext}>next</button>}
            {index === total - 1 && <span data-testid="is-last" />}
        </div>
    ),
}))

import { resetCanvasProgress } from '../model/useCanvasProgress'
import { TUTORIAL_STEPS } from '../model/tutorialSteps'
import { useWorkflowTutorialStore } from '../model/workflowTutorial.store'
import { WorkflowTutorial } from './WorkflowTutorial'

const KeyProbe = () => <span data-testid="location-key">{useLocation().key}</span>

const canvas = () => {
    const element = document.createElement('div')
    element.className = 'react-flow'
    document.body.appendChild(element)
    return element
}

/** The condition dialog's Save; the tutorial counts the click, not the canvas. */
const saveCondition = (kind: 'loop' | 'if' = 'if') => {
    const row = document.createElement('div')
    if (kind === 'loop') {
        row.className = 'conditionRule conditionRuleLoop'
        row.getBoundingClientRect = () => ({
            width: 400, height: 40, top: 0, left: 0, right: 400, bottom: 40, x: 0, y: 0,
            toJSON: () => ({}),
        })
        document.body.appendChild(row)
    }
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'workflow-condition-save')
    document.body.appendChild(button)
    button.click()
    button.remove()
    row.remove()
}

/**
 * Two references in the username field: the enhancement's delete action goes disabled
 * once it holds more than one, which is what tells two picks from one.
 */
const showEnhancement = () => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'workflow-enhancement-delete')
    button.disabled = true
    button.getBoundingClientRect = () => ({
        width: 24, height: 24, top: 0, left: 0, right: 24, bottom: 24, x: 0, y: 0,
        toJSON: () => ({}),
    })
    document.body.appendChild(button)
}

/** Closing the request editor, which is what commits the reference. */
const closeMethodDialog = () => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'workflow-method-dialog-close')
    document.body.appendChild(button)
    button.click()
    button.remove()
}

/** A loop-scoped reference reaching the endpoint field, as its pill. */
const insertEndpointReference = () => {
    const editor = document.createElement('div')
    editor.setAttribute('data-testid', 'workflow-url-editor')
    const pill = document.createElement('span')
    pill.className = 'oc-endpoint-ref'
    pill.textContent = 'B:customers[i].email'
    editor.appendChild(pill)
    // Left mounted: the latch reads the DOM from the observer callback, a microtask
    // later, which is exactly how the real editor behaves — the dialog stays open.
    document.body.appendChild(editor)
}

/**
 * The start button while a run is on — the signal the tutorial reads for "a test run
 * happened". Laid out, because a 0x0 box is how jsdom reports everything and the
 * latch rightly treats that as not on screen.
 */
const startRun = () => {
    const button = document.createElement('button')
    button.className = 'startNode startNodeButton startNodeRunning'
    button.getBoundingClientRect = () => ({
        width: 48, height: 48, top: 0, left: 0, right: 48, bottom: 48, x: 0, y: 0,
        toJSON: () => ({}),
    })
    document.body.appendChild(button)
}

/** One press of a replay-debugger control; each is read from the click alone. */
const pressDebugControl = (testId: string) => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', testId)
    document.body.appendChild(button)
    button.click()
    button.remove()
}

/** The whole test-run half: start it, freeze it, walk one line, jump an iteration. */
const debugRun = () => {
    startRun()
    pressDebugControl('workflow-test-pause-button')
    pressDebugControl('workflow-test-step-forward-button')
    pressDebugControl('workflow-node-skip-iteration-loop-1')
}

/** Laid out, because the latches rightly read a 0x0 box as not on screen. */
const laidOut = (element: HTMLElement) => {
    element.getBoundingClientRect = () => ({
        width: 300, height: 120, top: 0, left: 0, right: 300, bottom: 120, x: 0, y: 0,
        toJSON: () => ({}),
    })
    return element
}

/**
 * The schedules drawer, slid out. The open class is what the latch reads: the drawer
 * is mounted from the first render, parked off to the right.
 */
const openSchedules = () => {
    const panel = document.createElement('aside')
    panel.setAttribute('data-testid', 'workflow-schedules-panel')
    panel.className = 'rightDrawer rightDrawerOpen'
    document.body.appendChild(laidOut(panel))
    return panel
}

/** A schedule's card inside it, as the panel renders one per schedule. */
const createSchedule = () => {
    const panel = document.querySelector('[data-testid="workflow-schedules-panel"]') ?? document.body
    const card = document.createElement('div')
    card.className = 'wf-schedule-card'
    panel.appendChild(laidOut(card))
    return card
}

/** The whole scheduling half: open the drawer, then put a schedule in it. */
const scheduleIt = () => {
    openSchedules()
    createSchedule()
}

/** Real nodes render inside the canvas, so the fixture puts them there too. */
const addNode = (type: string) => {
    const node = document.createElement('div')
    node.className = `react-flow__node react-flow__node-${type}`
    ;(document.querySelector('.react-flow') ?? document.body).appendChild(node)
    return node
}

const renderTutorial = (entry = '/workflow/create') =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route path="/workflow/create" element={<><WorkflowTutorial /><KeyProbe /></>} />
            </Routes>
        </MemoryRouter>,
    )

/**
 * Every scenario below is about the graph-building and test-run steps; the
 * hand-advanced introduction ahead of them has nothing on the canvas to detect, so
 * clearing it here keeps those scenarios' step-index assertions unchanged.
 */
const renderPastIntro = () => {
    const view = renderTutorial()
    fireEvent.click(view.getByTestId('next'))
    return view
}

describe('WorkflowTutorial', () => {
    beforeEach(() => {
        // Set directly: `request()` also seeds the fake API fixtures, which this is not about.
        useWorkflowTutorialStore.setState({ requested: true })
        canvas()
    })
    afterEach(() => {
        // Through the store rather than setState: some scenarios below start the
        // tutorial for real (the query-string jump does), which registers the fake API
        // — and that has to come back off between tests.
        useWorkflowTutorialStore.getState().dismiss()
        resetCanvasProgress()
        document.body.innerHTML = ''
    })

    it('opens on the introduction, centred, before anything else', async () => {
        const view = renderTutorial()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        expect(view.getByTestId('step').textContent).toBe(at('intro'))
        expect(view.getByTestId('next')).toBeTruthy()

        fireEvent.click(view.getByTestId('next'))

        expect(view.getByTestId('step').textContent).toBe(at('customers'))
        view.unmount()
    })

    it('stops blocking the page as soon as a step points at a control', async () => {
        const view = renderTutorial()
        expect(view.container.querySelector('.workflow-tutorial-backdrop')).not.toBeNull()

        fireEvent.click(view.getByTestId('next'))
        addNode('connector')
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('loop')))

        expect(view.container.querySelector('.workflow-tutorial-backdrop')).toBeNull()
        view.unmount()
    })

    it('opens the second step as soon as the first method lands on the canvas', async () => {
        const view = renderPastIntro()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        expect(view.getByTestId('step').textContent).toBe(at('customers'))

        addNode('connector')

        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('loop')))
        view.unmount()
    })

    it('walks the whole scenario, waiting on the canvas and on the dialog steps', async () => {
        const view = renderPastIntro()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        const showing = (id: string) =>
            waitFor(() => expect(view.getByTestId('step').textContent).toBe(at(id)))

        await showing('customers')
        addNode('connector')
        await showing('loop')

        addNode('loop')
        // Placing the loop is not configuring it; that happens in a dialog, and the
        // save is the only evidence it happened.
        await showing('iterate')
        expect(view.queryByTestId('next')).toBeNull()
        saveCondition('loop')
        await showing('lookup')

        addNode('connector')
        // The canvas cannot show a reference, so this waits on the reference itself
        // rather than on a node appearing.
        await showing('endpoint')
        expect(view.queryByTestId('next')).toBeNull()
        insertEndpointReference()
        // The dialog still covers the canvas, so the step waits for it to be shut.
        await new Promise(resolve => setTimeout(resolve, 30))
        expect(view.getByTestId('step').textContent).toBe(at('endpoint'))
        closeMethodDialog()
        await showing('branch')

        addNode('if')
        // Placing the IF is not defining its condition; that is a second save.
        await showing('condition')
        expect(view.queryByTestId('next')).toBeNull()
        saveCondition()
        await showing('create')

        addNode('connector')
        await showing('username')

        showEnhancement()
        await new Promise(resolve => setTimeout(resolve, 30))
        expect(view.getByTestId('step').textContent).toBe(at('username'))
        closeMethodDialog()

        // The graph is finished; from here the run over it is the subject.
        await showing('testrun')
        expect(view.queryByTestId('next')).toBeNull()
        startRun()
        await showing('pause')
        pressDebugControl('workflow-test-pause-button')
        await showing('step')
        pressDebugControl('workflow-test-step-forward-button')
        await showing('iteration')
        pressDebugControl('workflow-node-skip-iteration-loop-1')

        // A pace and a read of the tree leave nothing behind to detect, so these two
        // are the only test-run steps the user confirms by hand.
        await showing('speed')
        fireEvent.click(view.getByTestId('next'))
        await showing('logs')
        fireEvent.click(view.getByTestId('next'))

        // And from there the schedule that will run it unattended.
        await showing('schedules')
        expect(view.queryByTestId('next')).toBeNull()
        openSchedules()
        await showing('schedule')
        expect(view.queryByTestId('next')).toBeNull()
        createSchedule()

        // Reading the card leaves nothing behind either, so it is confirmed by hand —
        // as is the sidebar entry after it, which is pointed at rather than followed.
        await showing('scheduleCard')
        fireEvent.click(view.getByTestId('next'))
        await showing('scheduleList')
        fireEvent.click(view.getByTestId('next'))
        await showing('summary')
        view.unmount()
    })

    it('offers a Next only on the steps the canvas cannot detect', async () => {
        const view = renderPastIntro()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        expect(view.getByTestId('step').textContent).toBe(at('customers'))
        expect(view.queryByTestId('next')).toBeNull()

        addNode('connector')
        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('loop')))
        expect(view.queryByTestId('next')).toBeNull()
        view.unmount()
    })

    it('settles on the last step rather than finishing by itself', async () => {
        const view = renderPastIntro()
        addNode('connector')
        addNode('connector')
        addNode('connector')
        addNode('loop')
        addNode('if')
        saveCondition('loop')
        saveCondition('if')
        insertEndpointReference()
        showEnhancement()
        closeMethodDialog()
        debugRun()
        scheduleIt()
        // The pace, the tree, the card and the sidebar entry have nothing to detect,
        // so they are acknowledged one at a time.
        for (let step = 0; step < 4; step += 1) {
            await waitFor(() => expect(view.getByTestId('next')).toBeTruthy())
            fireEvent.click(view.getByTestId('next'))
        }

        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(String(TUTORIAL_STEPS.length - 1)))
        // The last step has nothing to detect, so auto-advance must not run off the end
        // and dismiss the tutorial — and with it the canvas — behind the user's back.
        expect(useWorkflowTutorialStore.getState().requested).toBe(true)
        expect(view.getByTestId('is-last')).toBeTruthy()
        // Centred like the introduction, so the page is blocked again: it points at
        // nothing, and a stray click on the canvas would delete a node and send the
        // pill back to the step that asks for it.
        expect(view.container.querySelector('.workflow-tutorial-backdrop')).not.toBeNull()
        view.unmount()
    })

    it('steps back when the user removes what a step asked for', async () => {
        const view = renderPastIntro()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        const node = addNode('connector')
        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('loop')))

        node.remove()

        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('customers')))
        view.unmount()
    })

    // The bug: latched progress outlived the run, so a second one opened with the
    // loop already "configured" and skipped the step that cues the right-click.
    it('starts a second run from the beginning, however the first one ended', async () => {
        const first = renderPastIntro()
        addNode('connector')
        addNode('loop')
        saveCondition('loop')
        await waitFor(() => expect(first.getByTestId('step').textContent)
            .toBe(String(TUTORIAL_STEPS.findIndex(step => step.id === 'lookup'))))
        // left without dismissing, exactly as navigating away would
        first.unmount()
        document.body.innerHTML = ''

        useWorkflowTutorialStore.getState().dismiss()
        useWorkflowTutorialStore.getState().request()
        canvas()
        const second = renderPastIntro()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))

        // Rebuilding the graph is what exposes it: with the save still latched, the
        // loop's own step counts as done and the run skips to the one after it.
        addNode('connector')
        addNode('loop')

        await waitFor(() => expect(second.getByTestId('step').textContent).toBe(at('iterate')))
        second.unmount()
    })

    it('offers a way out on every step, not only the last', async () => {
        const view = renderTutorial()
        const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
        // Including the introduction itself — a sandbox the user should be able to
        // leave before ever touching the canvas, not only once they are mid-way in.
        expect(view.getByTestId('step').textContent).toBe(at('intro'))
        expect(view.getByTestId('exit')).toBeTruthy()
        expect(view.queryByTestId('is-last')).toBeNull()

        fireEvent.click(view.getByTestId('next'))
        addNode('connector')
        await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('loop')))
        expect(view.getByTestId('exit')).toBeTruthy()
        view.unmount()
    })

    // The scheduling steps are eleven actions in, so trying one meant building the
    // whole graph and sitting through a replay first.
    describe('the query-string jump', () => {
        it('opens on the step the URL names, with nothing built', async () => {
            const view = renderTutorial('/workflow/create?tutorialStep=schedules')
            const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))

            await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('schedules')))
            view.unmount()
        })

        it('carries on normally from there', async () => {
            const view = renderTutorial('/workflow/create?tutorialStep=schedules')
            const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))
            await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('schedules')))

            openSchedules()
            await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('schedule')))
            createSchedule()
            await waitFor(() => expect(view.getByTestId('step').textContent).toBe(at('scheduleCard')))
            view.unmount()
        })

        // Otherwise reaching a step by URL would mean running the palette command
        // first — which navigates here without the parameter.
        it('starts the tutorial when it was not running', async () => {
            useWorkflowTutorialStore.setState({ requested: false })

            const view = renderTutorial('/workflow/create?tutorialStep=schedules')

            await waitFor(() => expect(useWorkflowTutorialStore.getState().requested).toBe(true))
            expect(view.getByTestId('step')).toBeTruthy()
            view.unmount()
        })

        it('leaves an unknown name to open at the beginning', async () => {
            const view = renderTutorial('/workflow/create?tutorialStep=nope')
            const at = (id: string) => String(TUTORIAL_STEPS.findIndex(step => step.id === id))

            expect(view.getByTestId('step').textContent).toBe(at('intro'))
            view.unmount()
        })
    })

    it('resets the route when the tutorial is closed, so the invented graph goes with it', async () => {
        const view = renderTutorial()
        const before = view.getByTestId('location-key').textContent

        fireEvent.click(view.getByTestId('exit'))

        expect(useWorkflowTutorialStore.getState().requested).toBe(false)
        await waitFor(() => expect(view.getByTestId('location-key').textContent).not.toBe(before))
        view.unmount()
    })

    it('resets the route when the last step is finished', async () => {
        const view = renderPastIntro()
        addNode('connector')
        addNode('connector')
        addNode('connector')
        addNode('loop')
        addNode('if')
        saveCondition('loop')
        saveCondition('if')
        insertEndpointReference()
        showEnhancement()
        closeMethodDialog()
        debugRun()
        scheduleIt()
        for (let step = 0; step < 4; step += 1) {
            await waitFor(() => expect(view.getByTestId('next')).toBeTruthy())
            fireEvent.click(view.getByTestId('next'))
        }
        await waitFor(() => expect(view.getByTestId('is-last')).toBeTruthy())
        const before = view.getByTestId('location-key').textContent

        fireEvent.click(view.getByTestId('exit'))

        expect(useWorkflowTutorialStore.getState().requested).toBe(false)
        await waitFor(() => expect(view.getByTestId('location-key').textContent).not.toBe(before))
        view.unmount()
    })
})
