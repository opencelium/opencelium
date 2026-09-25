import { describe, expect, it } from 'vitest'
import { buildConnectionPayload } from '@features/workflow/api/connectionPayload'
import { buildTutorialGraph } from './tutorialGraph'
import { buildRunTree } from './tutorialRunScript'
import { TUTORIAL_STEPS, USERNAME_EXAMPLE } from './tutorialSteps'

const at = (id: string) => TUTORIAL_STEPS.findIndex(step => step.id === id)

const graphAt = (id: string) => {
    const graph = buildTutorialGraph(at(id))
    if (!graph) throw new Error(`no graph at ${id}`)
    return graph
}

/** What Save would send — the shape everything downstream of the canvas reads. */
const payloadAt = (id: string) => {
    const { nodes, edges, fieldBindings } = graphAt(id)
    return buildConnectionPayload({ title: 'Tutorial', description: '', nodes, edges, fieldBindings })
}

const methodNames = (id: string) =>
    graphAt(id).nodes.map(node => node.data.methodConfig?.name).filter(Boolean)

describe('tutorial graph', () => {
    it('leaves the canvas empty until a step has something to build on', () => {
        expect(buildTutorialGraph(at('intro'))).toBeNull()
        expect(buildTutorialGraph(at('customers'))).toBeNull()
    })

    // Each step opens on what the ones before it produced — and nothing of its own.
    it('builds exactly what the earlier steps would have', () => {
        expect(methodNames('loop')).toEqual(['getCustomers'])
        expect(graphAt('loop').nodes.some(node => node.type === 'loop')).toBe(false)
        expect(graphAt('iterate').nodes.find(node => node.type === 'loop')?.data.conditionConfig).toBeUndefined()
        expect(graphAt('lookup').nodes.find(node => node.type === 'loop')?.data.conditionConfig).toBeDefined()
        expect(methodNames('endpoint')).toEqual(['getCustomers', 'getClientByEmail'])
        expect(graphAt('condition').nodes.find(node => node.type === 'if')?.data.conditionConfig).toBeUndefined()
        expect(methodNames('username')).toEqual(['getCustomers', 'getClientByEmail', 'createClient'])
        expect(graphAt('username').fieldBindings).toEqual([])
    })

    // The scope is the lesson: the lookup and the IF live inside the loop, and the
    // create inside the IF's true branch.
    it('nests the steps the way the tutorial places them', () => {
        const tree = buildRunTree(payloadAt('testrun'))
        expect(tree.map(element => element.kind)).toEqual(['method', 'loop'])
        const loop = tree[1]
        expect(loop.children.map(element => element.kind)).toEqual(['method', 'if'])
        expect(loop.children[1].children.map(element => element.name)).toEqual(['createClient'])
    })

    it('configures the loop and the IF with the step\'s own answers', () => {
        const { operators } = payloadAt('testrun').fromConnector
        const loop = operators.find((operator: { type?: string }) => operator.type === 'loop')!
        const condition = operators.find((operator: { type?: string }) => operator.type === 'if')!
        expect(loop.iterator).toBe('i')
        expect(loop.expression).toMatch(/^for \{%#[0-9A-F]{6}\.\(response\)\.body\.\$\.customers\[\*\]%}$/)
        expect(condition.expression).toContain('.body.$.client.email')
        expect(condition.expression).toContain('!=')
        expect(condition.expression).toContain('.body.$.customers[i].email')
    })

    it('puts the loop-scoped email into the lookup\'s endpoint', () => {
        const lookup = payloadAt('branch').fromConnector.methods
            .find((method: { name?: string }) => method.name === 'getClientByEmail')!
        expect(lookup.request.endpoint)
            .toMatch(/^\/clients\?email=\{%#[0-9A-F]{6}\.\(response\)\.body\.\$\.customers\[i\]\.email%}$/)
    })

    it('joins first and last name into the username with the step\'s script', () => {
        const [binding] = graphAt('changeHistory').fieldBindings as {
            enhancement: { script: string; args: Record<string, string> }
        }[]
        expect(binding.enhancement.script).toBe(USERNAME_EXAMPLE)
        expect(binding.enhancement.args.RESULT_VAR).toMatch(/\.\(request\)\.body\.\$\.username$/)
        expect(binding.enhancement.args.VAR_0).toMatch(/customers\[i\]\.firstName$/)
        expect(binding.enhancement.args.VAR_1).toMatch(/customers\[i\]\.lastName$/)
    })

    it('gives every later step the finished graph', () => {
        const finished = graphAt('changeHistory')
        expect(graphAt('summary').nodes).toHaveLength(finished.nodes.length)
        expect(graphAt('summary').fieldBindings).toHaveLength(1)
    })
})
