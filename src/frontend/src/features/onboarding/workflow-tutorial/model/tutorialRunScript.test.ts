import { describe, expect, it } from 'vitest'
import { EMPTY_LIVE_LOG_TREE, reduceLiveLog, type LiveLogTree } from '@features/logs'
import { isStepLine } from '@features/workflow/test-run/playbackStep'
import { buildTutorialRunScript } from './tutorialRunScript'
import { TUTORIAL_ITERATIONS } from './tutorialRunFixtures'

/**
 * The scenario the tutorial walks the user through, in the shape `buildTestPayload`
 * produces: a method, a loop over it, a lookup inside the loop, an IF after the
 * lookup, and a create in the IF's true branch.
 */
const payload = {
    fromConnector: {
        methods: [
            { id: 'n1', index: '0', name: 'getCustomers', request: { endpoint: '/customers', method: 'GET' } },
            { id: 'n3', index: '1_0', name: 'getClientByEmail', request: { endpoint: '/clients?email=', method: 'GET' } },
            { id: 'n5', index: '1_1_0', name: 'createClient', request: { endpoint: '/clients', method: 'POST' } },
        ],
        operators: [
            { id: 'n2', index: '1', type: 'loop', iterator: 'i', expression: '#a1.(response).body.customers[*]' },
            { id: 'n4', index: '1_1', type: 'if', expression: '(found == false)' },
        ],
    },
}

const script = () => buildTutorialRunScript(payload)

/** The tree the log panel would end up showing, folded the way the panel folds it. */
const play = (): LiveLogTree =>
    script().logs.reduce<LiveLogTree>(reduceLiveLog, EMPTY_LIVE_LOG_TREE)

describe('tutorial run script', () => {
    it('frames the run the way the backend does', () => {
        const { logs } = script()
        expect(logs[0]).toMatchObject({ type: 'FLOWCHART', status: 'PENDING' })
        expect(logs.at(-2)).toMatchObject({ type: 'FLOWCHART', status: 'COMPLETE' })
        expect(logs.at(-1)).toMatchObject({ type: 'EXECUTION', status: 'COMPLETE' })
    })

    // Methods emit one COMPLETE and no PENDING; operators emit both. Getting this
    // backwards is invisible until the canvas token stops moving — isStepLine is what
    // decides which lines are transitions.
    it('emits a method as a single COMPLETE and an operator as a pair', () => {
        const { logs } = script()
        const forPath = (indexPath: string) =>
            logs.filter(log => log.indexPath === indexPath).map(log => log.status)

        expect(forPath('0')).toEqual(['COMPLETE'])
        expect(forPath('1')).toEqual(['PENDING', 'COMPLETE'])
        expect(logs.filter(isStepLine).length).toBeGreaterThan(0)
    })

    it('runs the loop body once per invented customer, tagged with the iteration', () => {
        const lookups = script().logs.filter(log => log.indexPath === '1_0')
        expect(lookups).toHaveLength(TUTORIAL_ITERATIONS)
        expect(lookups.map(log => log.properties?.loopIndex))
            .toEqual(['0', '1', '2'].slice(0, TUTORIAL_ITERATIONS))
    })

    // The loop's own lines carry the ENCLOSING context only — its own iteration
    // belongs to its children. Keying it otherwise orphans every child.
    it('leaves the loop out of its own iteration context', () => {
        const loop = script().logs.filter(log => log.indexPath === '1')
        expect(loop.every(log => log.properties?.loopIndex === '')).toBe(true)
    })

    it('lets the IF take both branches, agreeing with the lookup it reads', () => {
        const { logs } = script()
        const verdicts = logs
            .filter(log => log.indexPath === '1_1' && log.status === 'PENDING')
            .map(log => log.segment?.result)
        expect(new Set(verdicts)).toEqual(new Set(['true', 'false']))

        // The create only runs on the iterations the IF let through.
        const creates = logs.filter(log => log.indexPath === '1_1_0')
        expect(creates).toHaveLength(verdicts.filter(result => result === 'true').length)
    })

    it('folds into the tree the log panel renders', () => {
        const tree = play()
        expect(tree.executionStatus).toBe('COMPLETE')
        expect(tree.rootKeys).toHaveLength(1)
        expect(tree.errorLocations).toEqual([])

        const loop = Object.values(tree.nodes).find(node => node.type === 'LOOP')
        expect(loop?.iterationCount).toBe(TUTORIAL_ITERATIONS)
        // Only the first iteration is kept locally; the rest are paged in over REST.
        expect(loop?.storedIteration).toBe('0')
    })

    // The tree drops every iteration but the first, so the pager's other pages are
    // fetched — and a simulated run has to answer those itself or the pager is a
    // control that only ever loads one page.
    it('answers the loop pages the tree did not keep', () => {
        const tree = play()
        const loop = Object.values(tree.nodes).find(node => node.type === 'LOOP')!
        const { overrides } = script()

        for (let iteration = 1; iteration < TUTORIAL_ITERATIONS; iteration += 1) {
            const children = overrides[`/execution/log/element/${loop.id}/children?loopIndex=${iteration}`]
            expect(children).toBeDefined()
            expect(children).toHaveLength(2)
        }
    })

    // The pause reveal walks the tree from the root down and drops into REST at the
    // first level it cannot find locally, never looking locally again — so an
    // operator missing its children strands every reveal that passes through it.
    it('answers every operator occurrence, not only the pages the tree dropped', () => {
        const { logs, overrides } = script()
        const operators = logs.filter(log => log.type !== 'OPERATION' && log.indexPath)

        for (const operator of operators) {
            const pages = operator.type === 'LOOP' ? TUTORIAL_ITERATIONS : 1
            for (let page = 0; page < pages; page += 1) {
                expect(overrides[`/execution/log/element/${operator.id}/children?loopIndex=${page}`])
                    .toBeDefined()
            }
        }
    })

    it('answers every method row the tree can open', () => {
        const tree = play()
        const { overrides } = script()
        const methods = Object.values(tree.nodes).filter(node => node.type === 'OPERATION')

        expect(methods.length).toBeGreaterThan(0)
        for (const method of methods) {
            const detail = overrides[`/execution/log/element/${method.id}/details`]
            expect(detail).toMatchObject({ id: method.id, type: 'OPERATION' })
        }
    })

    it('declines a graph with nothing in it, rather than playing an empty run', () => {
        expect(buildTutorialRunScript({ fromConnector: { methods: [], operators: [] } }).logs)
            .toHaveLength(3)
    })
})
