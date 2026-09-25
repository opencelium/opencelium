import { afterEach, describe, expect, it } from 'vitest'
import { resolveHighlight, resolveStepFloor, resolveStepIndex, TUTORIAL_STEPS } from './tutorialSteps'
import { ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'
import { TUTORIAL_CONNECTORS } from './tutorialFixtures'
import type { CanvasProgress } from './useCanvasProgress'

// jsdom never lays out, so every element reports 0x0 — and findVisibleTarget
// rightly treats that as "not on screen". Stub a box so these stand in for real,
// rendered controls.
const mount = (markup: string) => {
    document.body.innerHTML = markup
    document.querySelectorAll<HTMLElement>('*').forEach(element => {
        element.getBoundingClientRect = () => ({
            width: 20, height: 20, top: 0, left: 0, right: 20, bottom: 20, x: 0, y: 0, toJSON: () => ({}),
        })
    })
}

const row = (testId: string) => `<button data-testid="${testId}"></button>`
/** A canvas node of the given type, with its own add triggers inside it. */
const node = (type: string, testId?: string) =>
    `<div class="react-flow__node-${type}" ${testId ? `data-testid="${testId}"` : ''}>` +
    row('workflow-add-step-right') + row('workflow-add-step-bottom') + '</div>'

const progress = (over: Partial<CanvasProgress> = {}): CanvasProgress =>
    ({ methods: 0, hasLoop: false, hasIf: false, loopConditionSaved: false, ifConditionSaved: false, endpointReference: false, endpointReferenceClosed: false, bodyReferencesPaired: false, bodyReferencesClosed: false, testRunStarted: false, testRunPaused: false, testRunStepped: false, testRunIterationSkipped: false, schedulesOpened: false, scheduleCreated: false, ...over })

/** Everything the graph-building half of the tutorial asks for. */
const BUILT: Partial<CanvasProgress> = {
    methods: 3, hasLoop: true, hasIf: true, loopConditionSaved: true, ifConditionSaved: true,
    endpointReference: true, endpointReferenceClosed: true,
    bodyReferencesPaired: true, bodyReferencesClosed: true,
}

/** ...and everything the test-run half asks for on top of it. */
const RUN: Partial<CanvasProgress> = {
    testRunStarted: true, testRunPaused: true,
    testRunStepped: true, testRunIterationSkipped: true,
}

/** ...and the scheduling half after that. */
const SCHEDULED: Partial<CanvasProgress> = {
    schedulesOpened: true, scheduleCreated: true,
}

/** One link of a step's chain, addressed by what it points at rather than by index. */
const link = (stepId: string, testId: string) => {
    const found = byId(stepId).chain.find(item => item.target.includes(testId))
    if (!found) throw new Error(`no link for ${testId} in ${stepId}`)
    return found
}

const byId = (id: string) => {
    const step = TUTORIAL_STEPS.find(s => s.id === id)
    if (!step) throw new Error(`no step ${id}`)
    return step
}

describe('workflow tutorial steps', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('opens on a centred introduction with nothing to point at', () => {
        const [first] = TUTORIAL_STEPS
        expect(first.id).toBe('intro')
        expect(first.anchor).toBe('center')
        expect(first.chain).toEqual([])
        expect(first.isDone).toBeUndefined()
    })

    it('walks every clickable step from the + to the method', () => {
        const first = byId('customers')
        expect(first.chain).toHaveLength(4)
        expect(first.chain[0].target).toContain('workflow-add-step')
    })

    it('undims the start node together with its +, so a lone icon is not left floating', () => {
        const first = byId('customers')
        expect(first.chain[0].include).toEqual(['.react-flow__node-start'])
        // only the first link needs the context; the rest are rows in a drawer
        expect(first.chain.slice(1).every(link => link.include === undefined)).toBe(true)
    })

    it('builds method selectors from the fixtures, so a rename cannot orphan them', () => {
        const method = TUTORIAL_CONNECTORS[0].invoker.operations[0].name.toLowerCase()
        expect(byId('customers').chain[3].target).toContain(method)
    })

    it('sends the two lookups at the second connector, not the first', () => {
        const support = String(TUTORIAL_CONNECTORS[1].connectorId)
        for (const id of ['lookup', 'create']) {
            expect(byId(id).chain[2].target).toContain(support)
        }
    })

    // The whole point of the scenario: a step placed off an operator's *bottom*
    // trigger lands inside its scope (index 1_0), while its right trigger continues
    // past it (index 2), where an iteration reference has nothing to resolve against.
    it('adds the nested steps from the operator bottom trigger, never the right one', () => {
        expect(byId('lookup').chain[0].target)
            .toBe('.react-flow__node-loop [data-testid="workflow-add-step-bottom"]')
        expect(byId('create').chain[0].target)
            .toBe('.react-flow__node-if [data-testid="workflow-add-step-bottom"]')
    })

    it('continues the chain from the right trigger of the step it follows', () => {
        expect(byId('loop').chain[0].target)
            .toBe('[data-testid="workflow-node-method-getcustomers"] [data-testid="workflow-add-step-right"]')
        expect(byId('branch').chain[0].target)
            .toBe('[data-testid="workflow-node-method-getclientbyemail"] [data-testid="workflow-add-step-right"]')
    })

    // The username row is a JSON-tree row with no id of its own, so it is found by the
    // key it prints; its reference icon only exists while the row is hovered, which is
    // why the row is the target and the cue explains the hover.
    it('finds the username row by what it shows, and cues the reference icon', () => {
        const row = byId('username').chain[2]
        expect(row.target).toContain('.variable-row')
        expect(row.text).toBe('username')
        expect(row.cue).toBe('reference')
    })

    // Both references go into the same field, so the row has to stay lit while the
    // picker is open — pointing at the picker alone left the field itself dark.
    it('keeps the username row lit with the picker that opens under it', () => {
        const row = link('username', 'workflow-request-body')
        expect(row.include).toEqual([
            '[data-testid="workflow-reference-generator"]',
            '.referenceMethodPopup',
            '.ant-select-dropdown',
        ])
        expect(row.when).toBeUndefined()
    })

    it('stays on the username row until two references make the enhancement', () => {
        const chain = byId('username').chain
        // A body row is matched by the key it prints, so the fixture prints one.
        mount('<div data-testid="workflow-request-body">'
            + '<div class="variable-row">"username":</div></div>'
            + row('workflow-enhancement-variables-toggle')
            + row('workflow-enhancement-variables'))

        // one reference in, no enhancement yet: still the field being filled
        expect(resolveHighlight(chain, progress())!.target).toContain('.variable-row')
        // both in: the variables take over
        expect(resolveHighlight(chain, progress({ bodyReferencesPaired: true }))!.target)
            .toBe('[data-testid="workflow-enhancement-variables"]')
    })

    it('sends the user to the folded variables panel, then into it', () => {
        const toggle = link('username', 'workflow-enhancement-variables-toggle')
        const variables = byId('username').chain.at(-1)!

        // Both wait for the enhancement; the fold gets its turn because the panel it
        // opens is not on screen until it is pressed.
        expect(toggle.when!(progress())).toBe(false)
        expect(toggle.when!(progress({ bodyReferencesPaired: true }))).toBe(true)
        expect(variables.target).toBe('[data-testid="workflow-enhancement-variables"]')
        expect(variables.include).toEqual([
            '#enhancement_code',
            '[data-testid="workflow-method-dialog-close"]',
        ])
    })

    it('reads the variables panel and the script together, once unfolded', () => {
        const chain = byId('username').chain
        const built = progress({ bodyReferencesPaired: true })

        mount(row('workflow-enhancement-variables-toggle'))
        expect(resolveHighlight(chain, built)!.target)
            .toBe('[data-testid="workflow-enhancement-variables-toggle"]')

        mount(row('workflow-enhancement-variables-toggle') + row('workflow-enhancement-variables'))
        expect(resolveHighlight(chain, built)!.target)
            .toBe('[data-testid="workflow-enhancement-variables"]')
    })

    it('finishes the body step only when the editor is closed over it', () => {
        const done = byId('username').isDone!
        expect(done(progress({ bodyReferencesPaired: true }))).toBe(false)
        expect(done(progress({ bodyReferencesPaired: true, bodyReferencesClosed: true }))).toBe(true)
    })

    it('walks the reference steps into the editor that creates one', () => {
        expect(byId('endpoint').chain.map(link => link.target)).toEqual([
            '[data-testid="workflow-node-method-getclientbyemail"]',
            '[data-testid="workflow-context-menu-edit-url"]',
            '[data-testid="workflow-url-insert-reference"]',
            '[data-testid="workflow-reference-generator"]',
            '[data-testid="workflow-reference-apply"]:not(:disabled)',
            '[data-testid="workflow-method-dialog-close"]',
        ])
        // Every list is portalled out of the row it belongs to, so it is undimmed
        // alongside it rather than being inside that row's own rectangle.
        expect(link('endpoint', 'workflow-reference-generator').include).toEqual([
            '.referenceMethodPopup',
            '.ant-select-dropdown',
            '[data-testid="workflow-method-dialog-close"]',
        ])
        expect(byId('username').chain.map(link => link.target)).toEqual([
            '[data-testid="workflow-node-method-createclient"]',
            '[data-testid="workflow-context-menu-edit-body"]',
            '[data-testid="workflow-request-body"] .variable-row',
            '[data-testid="workflow-enhancement-variables-toggle"]',
            '[data-testid="workflow-enhancement-variables"]',
        ])
    })

    it('points at the deepest control currently on screen', () => {
        const step = byId('customers')
        const testId = (index: number) =>
            step.chain[index].target.replace(/^\[data-testid="|"\]$/g, '')

        mount(node('start'))
        expect(resolveHighlight(step.chain, progress())).toBe(step.chain[0])

        // the drawer opened: point at the row inside it, not the + behind it
        mount(node('start') + row(testId(1)))
        expect(resolveHighlight(step.chain, progress())).toBe(step.chain[1])

        mount(node('start') + row(testId(1)) + row(testId(2)) + row(testId(3)))
        expect(resolveHighlight(step.chain, progress())).toBe(step.chain[3])
    })

    // Both triggers are rendered on every node, so a selector that is not scoped to
    // the right one silently points at the wrong insertion point.
    it('tells the loop apart from the step before it when both offer a +', () => {
        mount(node('connector', 'workflow-node-method-getcustomers') + node('loop'))
        expect(resolveHighlight(byId('lookup').chain, progress())).toBe(byId('lookup').chain[0])
        expect(resolveHighlight(byId('loop').chain, progress())).toBe(byId('loop').chain[0])
    })

    it('highlights nothing rather than guessing when the chain is absent', () => {
        expect(resolveHighlight(byId('customers').chain, progress())).toBeNull()
        expect(resolveHighlight([], progress())).toBeNull()
    })

    // Nothing about a node advertises that it has a context menu, and both request
    // editors open from one.
    it('cues a gesture only where one is not self-evident', () => {
        const cued = TUTORIAL_STEPS
            .flatMap(step => step.chain.map(link => ({ id: step.id, link })))
            .filter(entry => entry.link.cue)
        expect(cued.map(entry => entry.id))
            .toEqual(['iterate', 'endpoint', 'condition', 'username', 'username'])
        // Each step's gesture cue is on its first link — the node, not the menu it
        // opens. The body step carries a second one, on the row to add references to.
        const gestures = cued.filter(entry => entry.link.cue !== 'reference')
        for (const entry of gestures) expect(entry.link).toBe(byId(entry.id).chain[0])
    })

    // Nothing else is undimmed with it: the work happens in a dialog behind the menu,
    // so there is no companion control the way a `+` has its node.
    it('points at the loop alone when its configuration is the task', () => {
        const [first, , third] = byId('iterate').chain
        expect(first.target).toBe('.react-flow__node-loop')
        expect(first.include).toBeUndefined()
        expect(third.target).toBe('[data-testid="workflow-condition-builder"]')
        expect(byId('iterate').chain[1].target).toBe('[data-testid="workflow-context-menu-open-config"]')
    })

    // Configuring a loop is taught as the picks that do it rather than as the
    // reference they produce: the order is what matters, and each choice is what
    // narrows the list the next one comes from.
    it('configures the loop in four picks, in the order the dialog asks', () => {
        const picks = byId('iterate').picks!
        expect(picks).toHaveLength(4)
        // the operator first — the editor's own label, not a copy of it
        expect(picks[0]).toEqual({ labelKey: 'conditionBuilder.operators.loop.for' })
        // then the method, taken from the fixture so a rename cannot leave this
        // describing something that is not in the list
        expect(picks[1]).toEqual({ label: TUTORIAL_CONNECTORS[0].invoker.operations[0].name })
        expect(picks[2]).toEqual({ label: 'customers' })
        // and the editor's label for `[*]` — the whole array, not an iterator (that is
        // what the loop hands out) and not a fixed element
        expect(picks[3]).toEqual({ labelKey: 'references.wholeArray' })
    })

    // Both of these once printed the reference their picks produce. A snippet the user
    // never types is a result, not an instruction — the picks are the instruction.
    it('spells a reference out in picks rather than in a snippet', () => {
        expect(byId('iterate').example).toBeUndefined()
        expect(byId('endpoint').example).toBeUndefined()
    })

    // Saving the condition is the only evidence a loop was configured, so it is what
    // moves the pill on — the node looks identical either way.
    it('advances the loop step when a condition is saved', () => {
        const configured = byId('iterate').isDone!
        expect(configured(progress({ methods: 1, hasLoop: true }))).toBe(false)
        expect(configured(progress({ methods: 1, hasLoop: true, loopConditionSaved: true }))).toBe(true)
    })

    // The endpoint's reference is taught the same way as the loop's: the method, then
    // the field path one segment at a time, in the order the pickers ask for them.
    it('builds the endpoint reference from the method and then the path', () => {
        const picks = byId('endpoint').picks!

        expect(picks[0]).toEqual({ label: TUTORIAL_CONNECTORS[0].invoker.operations[0].name })
        expect(picks[1]).toEqual({ label: 'customers' })
        // the loop's own entry, carrying the iterator the editor interpolates into it —
        // not a fixed element, which would pin every iteration to the first customer
        expect(picks[2]).toEqual({
            labelKey: 'references.iteratorLoop',
            values: { iterator: ITERATOR_NAMES[0] },
        })
        expect(picks[3]).toEqual({ label: 'email' })
    })

    it('joins the two references in the closing script', () => {
        expect(byId('username').example).toBe('RESULT_VAR = VAR_0 + " " + VAR_1')
    })

    it('lists picks only where a sequence of choices is the task', () => {
        const withPicks = TUTORIAL_STEPS.filter(step => step.picks).map(step => step.id)
        expect(withPicks).toEqual(['iterate', 'endpoint'])
    })

    it('gives a snippet only to the steps that describe one', () => {
        const withExample = TUTORIAL_STEPS.filter(step => step.example).map(step => step.id)
        expect(withExample).toEqual(['condition', 'username', 'schedule'])
    })

    // Double-click is what opens an operator's condition; the loop's own step uses the
    // context menu instead, which reaches the same dialog.
    it('points at the IF alone, then the button that adds the comparison', () => {
        const [node, add] = byId('condition').chain
        expect(node.target).toBe('.react-flow__node-if')
        expect(node.include).toBeUndefined()
        expect(node.cue).toBe('double-click')
        expect(add.target).toBe('[data-testid="workflow-condition-add-condition"]')
    })

    // The button is only the way to make the row; once it exists the row is the task.
    it('moves on to the comparison row once it exists', () => {
        const rule = '[data-testid="workflow-condition-rule"]'
        expect(byId('condition').chain.at(-1)!.target).toBe(rule)
        // the loop's group is created holding a row, so its dialog lands on one too
        expect(byId('iterate').chain.at(-1)!.target).toBe(rule)
    })

    // A picker's list is portalled to the body, so it sits outside the row's rectangle
    // and would be dimmed at the very moment the user has to read it.
    it('undims the open list wherever a reference is chosen', () => {
        expect(byId('iterate').chain.at(-1)!.include).toContain('.ant-select-dropdown')
        expect(byId('condition').chain.at(-1)!.include).toContain('.ant-select-dropdown')
        expect(link('endpoint', 'workflow-reference-generator').include)
            .toContain('.ant-select-dropdown')
    })

    // A spotlight that only ever points inward leaves the user with the work done and
    // no visible way to commit it.
    it('undims the way out of each dialog it sends the user into', () => {
        for (const id of ['iterate', 'condition']) {
            expect(byId(id).chain.at(-1)!.include)
                .toContain('[data-testid="workflow-condition-save"]')
        }
        // While the generator is open, Close is undimmed with it; once the reference
        // is in, Close becomes the target in its own right.
        expect(link('endpoint', 'workflow-reference-generator').include)
            .toContain('[data-testid="workflow-method-dialog-close"]')
        expect(byId('endpoint').chain.at(-1)!.target)
            .toBe('[data-testid="workflow-method-dialog-close"]')
    })

    /*
     * The `+` that commits the reference is a borderless glyph at the end of the
     * generator's row, and the step used to leave the whole row lit right through it —
     * so a user who had built the reference correctly had nothing telling them what
     * closes the deal. It is disabled until both picks are made, which is what the
     * chain narrows on.
     */
    it('narrows onto the apply action once the reference is the one being taught', () => {
        const chain = byId('endpoint').chain
        const generator = '[data-testid="workflow-reference-generator"]'
        // The field picker shows the path it has built through the select's search
        // input, never as text — see LegacyResponseFieldSelect.
        const showing = (path: string, applyEnabled: boolean) =>
            `<div data-testid="workflow-reference-generator"><input value="${path}">`
            + `<button data-testid="workflow-reference-apply" ${applyEnabled ? '' : 'disabled'}>`
            + '</button></div>'

        // nothing picked: the row is the instruction
        mount(showing('', false))
        expect(resolveHighlight(chain, progress())?.target).toBe(generator)

        // one segment in. The apply action is already live — `customers` on its own is
        // a perfectly applicable reference — but it is not the one the step describes,
        // and lighting the `+` here would send the user off two picks early.
        mount(showing('customers', true))
        expect(resolveHighlight(chain, progress())?.target).toBe(generator)

        // the whole path, so the glyph becomes the thing to press
        mount(showing(`customers[${ITERATOR_NAMES[0]}].email`, true))
        const ready = resolveHighlight(chain, progress())
        expect(ready?.target).toBe('[data-testid="workflow-reference-apply"]:not(:disabled)')
        // and nothing undimmed with it: including the row would put the cut-out back
        // around the whole generator, which is the state this link exists to leave
        expect(ready?.include).toBeUndefined()
    })

    // The generator closes itself once the reference is applied, so without a gate the
    // highlight would drop back to the button that opened it.
    it('sends the user to Close once the reference is in, not back to Insert Reference', () => {
        const chain = byId('endpoint').chain
        const dom = node('connector', 'workflow-node-method-getclientbyemail')
            + row('workflow-url-insert-reference')
            + row('workflow-method-dialog-close')
            + row('workflow-url-editor')

        mount(dom)
        expect(resolveHighlight(chain, progress())!.target)
            .toBe('[data-testid="workflow-url-insert-reference"]')

        mount(dom)
        expect(resolveHighlight(chain, progress({ endpointReference: true }))!.target)
            .toBe('[data-testid="workflow-method-dialog-close"]')
    })

    it('shows the endpoint alongside Close, so the reference can be read first', () => {
        const close = byId('endpoint').chain.at(-1)!
        expect(close.include).toEqual(['[data-testid="workflow-url-editor"]'])
        expect(close.when).toBeTypeOf('function')
    })

    it('prefers the comparison row over the dialog around it', () => {
        const chain = byId('condition').chain
        mount(node('if') + row('workflow-condition-add-condition'))
        expect(resolveHighlight(chain, progress())).toBe(chain[1])

        mount(node('if') + row('workflow-condition-add-condition') + row('workflow-condition-rule'))
        expect(resolveHighlight(chain, progress())).toBe(chain[2])
    })

    it('compares the lookup against the customer being walked', () => {
        const iterator = ITERATOR_NAMES[0]
        // The two field paths, as the dialog's selects show them — not whole references.
        expect(byId('condition').example).toBe(`client.email ≠ customers[${iterator}].email`)
    })

    it('waits for a second condition save, the loop having been the first', () => {
        const configured = byId('condition').isDone!
        const built = progress({
            methods: 2, hasLoop: true, hasIf: true,
            endpointReference: true, endpointReferenceClosed: true,
        })
        expect(configured({ ...built, loopConditionSaved: true })).toBe(false)
        expect(configured({ ...built, loopConditionSaved: true, ifConditionSaved: true })).toBe(true)
    })

    // Counting saves made the IF's step satisfiable by re-saving the loop's condition.
    it('attributes each condition to the operator it belongs to', () => {
        const loop = byId('iterate').isDone!
        const branch = byId('condition').isDone!
        const built = progress({ methods: 3, hasLoop: true, hasIf: true })

        expect(loop({ ...built, loopConditionSaved: true })).toBe(true)
        expect(branch({ ...built, loopConditionSaved: true })).toBe(false)
        expect(branch({ ...built, ifConditionSaved: true })).toBe(true)
        expect(loop({ ...built, ifConditionSaved: true })).toBe(false)
    })

    // Every scheduling chain opens on the pill, for the same reason the test-run ones
    // open on the start button: the drawer is something the user closes to get the
    // canvas back, and the way in again is the pill, not what was inside it.
    it('reaches every scheduling step through the header pill', () => {
        for (const id of ['schedules', 'schedule', 'scheduleCard']) {
            expect(byId(id).chain[0].target).toBe('[data-testid="workflow-schedules-pill"]')
        }
    })

    // The one step that points outside the editor, and the only target the tutorial
    // does not own: the sidebar derives it from the route, in `menues.tsx` (`leaf`).
    // Pinned literally rather than rebuilt with buildTestId, which would pass whatever
    // the source did — if that entry is renamed or loses its id, this is what says so.
    it('points at the sidebar entry the menu actually renders', () => {
        const [entry] = byId('scheduleList').chain
        expect(entry.target).toBe('[data-testid="sidebar-menu-schedule"]')
        // No cue and no isDone: following the link would leave /workflow/create and
        // take the tutorial with it, so this step is looked at, not acted on.
        expect(entry.cue).toBeUndefined()
        expect(byId('scheduleList').isDone).toBeUndefined()
    })

    it('hands the create dialog the whole form, not one field at a time', () => {
        const dialog = link('schedule', 'workflow-schedule-title')
        expect(dialog.include).toEqual([
            '[data-testid="workflow-schedule-debug"]',
            '[data-testid="workflow-schedule-cron"]',
            '[data-testid="workflow-schedule-submit"]',
        ])
    })

    // The drawer is mounted from the first render, parked at translateX(100%) — so a
    // highlight resolved off a bare presence check would point off-screen.
    it('reaches into the drawer only once it is out', () => {
        mount(`<aside data-testid="workflow-schedules-panel" style="visibility:hidden">`
            + row('workflow-schedules-add') + '</aside>'
            + row('workflow-schedules-pill'))

        expect(resolveHighlight(byId('schedule').chain, progress())?.target)
            .toBe('[data-testid="workflow-schedules-pill"]')
    })

    // Read, not used: a jump or a restored version would take nodes off the canvas the
    // earlier steps are counting, so both wait for Next like the other reading steps.
    it('walks to each history drawer through the header menu, and waits for Next', () => {
        expect(byId('changeHistory').chain.map(item => item.target)).toEqual([
            '[data-testid="workflow-menu"]',
            '[data-testid="workflow-menu-item-change-history"]',
            '[data-testid="workflow-change-history-panel"]',
        ])
        expect(byId('versionHistory').chain.at(-1)!.target).toBe('[data-testid="workflow-history-panel"]')
        expect(link('versionHistory', 'workflow-menu-item-version-history').include).toEqual(['.headerMenu'])
        expect(byId('changeHistory').isDone).toBeUndefined()
        expect(byId('versionHistory').isDone).toBeUndefined()
    })

    // Once the graph is finished, and before the run over it.
    it('sits between the finished graph and the test run', () => {
        const ids = TUTORIAL_STEPS.map(step => step.id)
        expect(ids.slice(ids.indexOf('username'), ids.indexOf('testrun') + 1)).toEqual(
            ['username', 'changeHistory', 'versionHistory', 'testrun'])
    })

    // Left open from the step before, the change history's overlay would swallow the
    // click on the menu button, so its close is what the version step points at first.
    it('closes a still-open change history before pointing at the menu', () => {
        mount(`<aside data-testid="workflow-change-history-panel">`
            + row('workflow-change-history-close') + '</aside>'
            + row('workflow-menu'))
        expect(resolveHighlight(byId('versionHistory').chain, progress())?.target)
            .toBe('[data-testid="workflow-change-history-close"]')

        mount(row('workflow-menu'))
        expect(resolveHighlight(byId('versionHistory').chain, progress())?.target)
            .toBe('[data-testid="workflow-menu"]')
    })

    it('samples the change history in the panel\'s own words, with the fixtures\' methods', () => {
        const entries = byId('changeHistory').entries!
        const [lookup, create] = TUTORIAL_CONNECTORS[1].invoker.operations
        expect(entries).toEqual([
            { labelKey: 'undoHistory.change.nodeAdded', values: { name: create.name } },
            { labelKey: 'undoHistory.change.methodUrl', values: { name: lookup.name } },
            { labelKey: 'undoHistory.change.initial' },
        ])
        expect(TUTORIAL_STEPS.filter(step => step.entries).map(step => step.id)).toEqual(['changeHistory'])
    })

    it('shows the editor\'s undo and redo bindings on the change history step', () => {
        expect(byId('changeHistory').shortcuts).toEqual([
            { combos: [['mod', 'z']], labelKey: 'actions.undo' },
            { combos: [['mod', 'shift', 'z'], ['mod', 'y']], labelKey: 'actions.redo' },
        ])
        expect(TUTORIAL_STEPS.filter(step => step.shortcuts).map(step => step.id)).toEqual(['changeHistory'])
    })

    describe('resolveStepFloor', () => {
        it('reads the step named in the query string', () => {
            expect(resolveStepFloor('?tutorialStep=schedules'))
                .toBe(TUTORIAL_STEPS.findIndex(step => step.id === 'schedules'))
            expect(resolveStepFloor('?foo=1&tutorialStep=summary'))
                .toBe(TUTORIAL_STEPS.length - 1)
        })

        // 1-based, as the pill's counter prints it.
        it('reads a step number as the counter shows it', () => {
            expect(resolveStepFloor('?tutorialStep=1')).toBe(0)
            expect(resolveStepFloor('?tutorialStep=10'))
                .toBe(TUTORIAL_STEPS.findIndex(step => step.id === 'username'))
            expect(resolveStepFloor(`?tutorialStep=${TUTORIAL_STEPS.length}`))
                .toBe(TUTORIAL_STEPS.length - 1)
        })

        it('ignores a number outside the steps', () => {
            expect(resolveStepFloor('?tutorialStep=0')).toBeNull()
            expect(resolveStepFloor(`?tutorialStep=${TUTORIAL_STEPS.length + 1}`)).toBeNull()
            expect(resolveStepFloor('?tutorialStep=-3')).toBeNull()
            expect(resolveStepFloor('?tutorialStep=2.5')).toBeNull()
        })

        // The fallback is the tutorial opening at the beginning, which is where it
        // opens anyway — so a typo is not worth refusing over.
        it('ignores an absent or unknown name', () => {
            expect(resolveStepFloor('')).toBeNull()
            expect(resolveStepFloor('?foo=1')).toBeNull()
            expect(resolveStepFloor('?tutorialStep=')).toBeNull()
            expect(resolveStepFloor('?tutorialStep=nope')).toBeNull()
        })
    })

    it('leaves only the closing step for the user to confirm', () => {
        expect(byId('summary').isDone).toBeUndefined()
        expect(byId('summary').chain).toEqual([])
    })

    // The two that book-end it, and only those: everything between them points at a
    // control, which a pill in the middle of the screen would sit on top of.
    it('centres the opening and closing steps alone', () => {
        const centred = TUTORIAL_STEPS.filter(step => step.anchor === 'center').map(step => step.id)
        expect(centred).toEqual(['intro', 'summary'])
    })

    it('gates each detectable step on its own piece of the canvas', () => {
        expect(byId('customers').isDone!(progress())).toBe(false)
        expect(byId('customers').isDone!(progress({ methods: 1 }))).toBe(true)

        // A loop must not be satisfied by an IF, nor the other way round.
        expect(byId('loop').isDone!(progress({ methods: 1, hasIf: true }))).toBe(false)
        expect(byId('loop').isDone!(progress({ methods: 1, hasLoop: true }))).toBe(true)
        expect(byId('branch').isDone!(progress({ methods: 2, hasLoop: true }))).toBe(false)
        expect(byId('branch').isDone!(progress({ methods: 2, hasIf: true }))).toBe(true)

        expect(byId('lookup').isDone!(progress({ methods: 1 }))).toBe(false)
        expect(byId('lookup').isDone!(progress({ methods: 2 }))).toBe(true)
        expect(byId('create').isDone!(progress({ methods: 2 }))).toBe(false)
        expect(byId('create').isDone!(progress({ methods: 3 }))).toBe(true)
    })

    describe('resolveStepIndex', () => {
        const at = (id: string) => TUTORIAL_STEPS.findIndex(s => s.id === id)
        /** Acknowledged just past the introduction — the baseline every graph-building
         *  assertion below means by "nothing acknowledged yet". */
        const PAST_INTRO = at('intro') + 1

        it('holds on the introduction before anything else, however built the graph already is', () => {
            expect(resolveStepIndex(progress(), 0)).toBe(at('intro'))
            expect(resolveStepIndex(progress({ ...BUILT, ...RUN }), 0)).toBe(at('intro'))
        })

        it('asks for the first thing the canvas is missing', () => {
            expect(resolveStepIndex(progress(), PAST_INTRO)).toBe(at('customers'))
            expect(resolveStepIndex(progress({ methods: 1 }), PAST_INTRO)).toBe(at('loop'))
            // the loop exists but has not been configured, so it stops there
            expect(resolveStepIndex(progress({ methods: 1, hasLoop: true }), PAST_INTRO)).toBe(at('iterate'))
            expect(resolveStepIndex(progress({ methods: 1, hasLoop: true, loopConditionSaved: true }), PAST_INTRO))
                .toBe(at('lookup'))
        })

        it('holds on the endpoint step until the editor is closed', () => {
            const built = progress({ methods: 2, hasLoop: true, loopConditionSaved: true })
            expect(resolveStepIndex(built, PAST_INTRO)).toBe(at('endpoint'))
            // no acknowledgement can skip it
            expect(resolveStepIndex(built, TUTORIAL_STEPS.length)).toBe(at('endpoint'))
            // nor does the reference alone, while the dialog still covers the canvas
            expect(resolveStepIndex({ ...built, endpointReference: true }, PAST_INTRO)).toBe(at('endpoint'))
            expect(resolveStepIndex({ ...built, endpointReference: true, endpointReferenceClosed: true }, PAST_INTRO))
                .toBe(at('branch'))
        })

        it('advances the endpoint step only once the editor is closed', () => {
            const done = byId('endpoint').isDone!
            const built = progress({ methods: 2, hasLoop: true, loopConditionSaved: true })
            expect(done(built)).toBe(false)
            expect(done({ ...built, endpointReference: true })).toBe(false)
            expect(done({ ...built, endpointReference: true, endpointReferenceClosed: true })).toBe(true)
        })

        it('holds on the loop step until its condition is saved', () => {
            const looped = progress({ methods: 1, hasLoop: true })
            expect(resolveStepIndex(looped, PAST_INTRO)).toBe(at('iterate'))
            // no acknowledgement can skip it — only the save does
            expect(resolveStepIndex(looped, TUTORIAL_STEPS.length)).toBe(at('iterate'))
            expect(resolveStepIndex(progress({ methods: 1, hasLoop: true, loopConditionSaved: true }), PAST_INTRO))
                .toBe(at('lookup'))
        })

        it('settles on the closing step instead of running off the end', () => {
            const finished = progress({ ...BUILT, ...RUN, ...SCHEDULED })
            const last = TUTORIAL_STEPS.length - 1
            // Acknowledged only past the introduction, it holds on the first built
            // step there is nothing to detect for — the change history — rather than
            // skipping to the end.
            expect(resolveStepIndex(finished, PAST_INTRO)).toBe(at('changeHistory'))
            // and once those are passed it stays on the last, however many times it
            // is acknowledged.
            expect(resolveStepIndex(finished, TUTORIAL_STEPS.length)).toBe(last)
        })

        it('steps back when the user removes what an earlier step asked for', () => {
            expect(resolveStepIndex(progress({ ...BUILT, ...RUN, methods: 0 }),
                TUTORIAL_STEPS.length)).toBe(at('customers'))
        })

        // The graph is what the first half is read from; the run over it is not part
        // of the graph, so the test-run steps have to hold the tutorial on their own.
        it('asks for the run once the graph is finished and both histories are read', () => {
            const built = progress(BUILT)
            // the histories come first, and hold until acknowledged
            expect(resolveStepIndex(built, PAST_INTRO)).toBe(at('changeHistory'))
            expect(resolveStepIndex(built, at('versionHistory'))).toBe(at('versionHistory'))
            const READ = at('testrun')
            expect(resolveStepIndex(built, READ)).toBe(at('testrun'))
            expect(resolveStepIndex({ ...built, testRunStarted: true }, READ)).toBe(at('pause'))
            expect(resolveStepIndex({ ...built, testRunStarted: true, testRunPaused: true }, READ))
                .toBe(at('step'))
            expect(resolveStepIndex({
                ...built, testRunStarted: true, testRunPaused: true, testRunStepped: true,
            }, READ)).toBe(at('iteration'))
            // no acknowledgement can skip a step the canvas can still detect
            expect(resolveStepIndex(built, TUTORIAL_STEPS.length)).toBe(at('testrun'))
        })

        // The jump exists so a late step can be tried without building the graph and
        // sitting through a replay first, which is eleven actions away.
        it('opens on the step a URL names, with nothing on the canvas', () => {
            const floor = at('schedules')
            expect(resolveStepIndex(progress(), 0, floor)).toBe(floor)
            // and an empty canvas cannot drag it back to the step that wants a method
            expect(resolveStepIndex(progress(), TUTORIAL_STEPS.length, floor)).toBe(floor)
        })

        it('carries on normally from the step it jumped to', () => {
            const floor = at('schedules')
            expect(resolveStepIndex(progress({ schedulesOpened: true }), 0, floor))
                .toBe(at('schedule'))
            expect(resolveStepIndex(progress(SCHEDULED), 0, floor)).toBe(at('scheduleCard'))
        })

        // The pace, the log tree and a created schedule's card are preferences and
        // reading, not results.
        it('leaves the pace, the tree and the card for the user to confirm', () => {
            expect(byId('speed').isDone).toBeUndefined()
            expect(byId('logs').isDone).toBeUndefined()
            expect(byId('scheduleCard').isDone).toBeUndefined()
            const ready = progress({ ...BUILT, ...RUN, ...SCHEDULED })
            expect(resolveStepIndex(ready, at('speed'))).toBe(at('speed'))
            expect(resolveStepIndex(ready, at('logs'))).toBe(at('logs'))
            expect(resolveStepIndex(ready, at('scheduleCard'))).toBe(at('scheduleCard'))
        })

        // Scheduling comes after the run for a reason: the tutorial's own argument is
        // that you prove a workflow before you let it run unattended.
        it('asks for a schedule once the run has been read', () => {
            const ran = progress({ ...BUILT, ...RUN })
            expect(resolveStepIndex(ran, at('schedules'))).toBe(at('schedules'))
            expect(resolveStepIndex({ ...ran, schedulesOpened: true }, at('schedules')))
                .toBe(at('schedule'))
            expect(resolveStepIndex({ ...ran, ...SCHEDULED }, at('schedules')))
                .toBe(at('scheduleCard'))
            // and no acknowledgement can skip either of them
            expect(resolveStepIndex(ran, TUTORIAL_STEPS.length)).toBe(at('schedules'))
        })
    })
})
