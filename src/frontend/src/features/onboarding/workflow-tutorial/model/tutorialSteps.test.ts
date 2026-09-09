import { afterEach, describe, expect, it } from 'vitest'
import { resolveHighlight, resolveStepIndex, TUTORIAL_STEPS } from './tutorialSteps'
import { buildReferenceValue, ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'
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
    ({ methods: 0, hasLoop: false, hasIf: false, loopConditionSaved: false, ifConditionSaved: false, endpointReference: false, endpointReferenceClosed: false, bodyReferencesPaired: false, bodyReferencesClosed: false, ...over })

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

    it('walks every clickable step from the + to the method', () => {
        const [first] = TUTORIAL_STEPS
        expect(first.chain).toHaveLength(4)
        expect(first.chain[0].target).toContain('workflow-add-step')
    })

    it('undims the start node together with its +, so a lone icon is not left floating', () => {
        const [first] = TUTORIAL_STEPS
        expect(first.chain[0].include).toEqual(['.react-flow__node-start'])
        // only the first link needs the context; the rest are rows in a drawer
        expect(first.chain.slice(1).every(link => link.include === undefined)).toBe(true)
    })

    it('builds method selectors from the fixtures, so a rename cannot orphan them', () => {
        const method = TUTORIAL_CONNECTORS[0].invoker.operations[0].name.toLowerCase()
        expect(TUTORIAL_STEPS[0].chain[3].target).toContain(method)
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
        expect(resolveHighlight(TUTORIAL_STEPS[0].chain, progress())).toBeNull()
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

    it('shows the loop the whole array, not an element and not an iterator', () => {
        const example = byId('iterate').example!
        expect(example).toBe(`#${buildReferenceValue('a1b2c3', 'body', 'customers[*]')}`)
        expect(example).toContain('customers[*]')
        // the iterator is what the loop hands out, not part of its own input
        expect(example).not.toContain(`[${ITERATOR_NAMES[0]}]`)
        // and [0] would pin every iteration to the first customer
        expect(example).not.toContain('[0]')
    })

    // Saving the condition is the only evidence a loop was configured, so it is what
    // moves the pill on — the node looks identical either way.
    it('advances the loop step when a condition is saved', () => {
        const configured = byId('iterate').isDone!
        expect(configured(progress({ methods: 1, hasLoop: true }))).toBe(false)
        expect(configured(progress({ methods: 1, hasLoop: true, loopConditionSaved: true }))).toBe(true)
    })

    // The step tells the user to pick customers, then the loop, then email. The
    // snippet under it has to be what that actually produces — built by the same
    // function the generator applies, so the two cannot drift apart.
    it('shows the reference the described picks really produce', () => {
        const iterator = ITERATOR_NAMES[0]
        const reference = buildReferenceValue('a1b2c3', 'body', `customers[${iterator}].email`)

        expect(byId('endpoint').example).toBe(`/clients?email=#${reference}`)
        // the loop iterator is in the path, not a fixed element
        expect(byId('endpoint').example).toContain(`customers[${iterator}]`)
        expect(byId('endpoint').example).not.toContain('[0]')
    })

    it('joins the two references in the closing script', () => {
        expect(byId('username').example).toBe('RESULT_VAR = VAR_0 + " " + VAR_1')
    })

    it('gives a snippet only to the steps that describe one', () => {
        const withExample = TUTORIAL_STEPS.filter(step => step.example).map(step => step.id)
        expect(withExample).toEqual(['iterate', 'endpoint', 'condition', 'username'])
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

    it('leaves only the closing step for the user to confirm', () => {
        expect(byId('summary').isDone).toBeUndefined()
        expect(byId('summary').chain).toEqual([])
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

        it('asks for the first thing the canvas is missing', () => {
            expect(resolveStepIndex(progress(), 0)).toBe(at('customers'))
            expect(resolveStepIndex(progress({ methods: 1 }), 0)).toBe(at('loop'))
            // the loop exists but has not been configured, so it stops there
            expect(resolveStepIndex(progress({ methods: 1, hasLoop: true }), 0)).toBe(at('iterate'))
            expect(resolveStepIndex(progress({ methods: 1, hasLoop: true, loopConditionSaved: true }), 0))
                .toBe(at('lookup'))
        })

        it('holds on the endpoint step until the editor is closed', () => {
            const built = progress({ methods: 2, hasLoop: true, loopConditionSaved: true })
            expect(resolveStepIndex(built, 0)).toBe(at('endpoint'))
            // no acknowledgement can skip it
            expect(resolveStepIndex(built, TUTORIAL_STEPS.length)).toBe(at('endpoint'))
            // nor does the reference alone, while the dialog still covers the canvas
            expect(resolveStepIndex({ ...built, endpointReference: true }, 0)).toBe(at('endpoint'))
            expect(resolveStepIndex({ ...built, endpointReference: true, endpointReferenceClosed: true }, 0))
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
            expect(resolveStepIndex(looped, 0)).toBe(at('iterate'))
            // no acknowledgement can skip it — only the save does
            expect(resolveStepIndex(looped, TUTORIAL_STEPS.length)).toBe(at('iterate'))
            expect(resolveStepIndex(progress({ methods: 1, hasLoop: true, loopConditionSaved: true }), 0))
                .toBe(at('lookup'))
        })

        it('settles on the closing step instead of running off the end', () => {
            const finished = progress({
                methods: 3, hasLoop: true, hasIf: true, loopConditionSaved: true, ifConditionSaved: true,
                endpointReference: true, endpointReferenceClosed: true,
                bodyReferencesPaired: true, bodyReferencesClosed: true,
            })
            const last = TUTORIAL_STEPS.length - 1
            expect(resolveStepIndex(finished, 0)).toBe(last)
            // and stays there however many times it is acknowledged
            expect(resolveStepIndex(finished, TUTORIAL_STEPS.length)).toBe(last)
        })

        it('steps back when the user removes what an earlier step asked for', () => {
            expect(resolveStepIndex(progress({
                hasLoop: true, hasIf: true, loopConditionSaved: true, ifConditionSaved: true,
                endpointReference: true, endpointReferenceClosed: true,
                bodyReferencesPaired: true, bodyReferencesClosed: true,
            }), TUTORIAL_STEPS.length)).toBe(at('customers'))
        })
    })
})
