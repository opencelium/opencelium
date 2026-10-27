import { z } from 'zod'
import { type WorkflowConnectors, operationStepSchema } from '../dsl/buildConstrainedSchema.ts'
import { type ConnectorSide, conditionSchema } from '../dsl/workflowDsl.schema.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import type { PlanStep } from './workflowPlan.schema.ts'

type OperationRef = { side: ConnectorSide; invoker: Invoker; operation: InvokerOperation }

export type SkeletonNode =
    | { id: string; kind: 'method'; text: string; op: OperationRef }
    | { id: string; kind: 'loop'; text: string; sourceId: string; sourceOperation: string; body: SkeletonNode[] }
    | { id: string; kind: 'if'; text: string; then: SkeletonNode[] }

export type PlanSkeleton = {
    nodes: SkeletonNode[]
    /** Plan lines that are not a step of their own (field mappings, remarks), passed on as instructions. */
    notes: string[]
}

const LOOP_RE = /^for each\b/i
const IF_RE = /^if\b/i
/** "Create and update set: Name = title", "Update also sets ID = …": field instructions, even when they name an operation. */
const ASSIGNMENT_RE = /=/

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Operations a line names, in the order they appear. A name must stand alone: not inside a longer name such as
 * `cmdb.objects.read.all`, but a sentence's full stop after it is fine.
 */
function operationsIn(text: string, connectors: WorkflowConnectors): OperationRef[] {
    const sides: [ConnectorSide, Invoker][] = [['from', connectors.from]]
    if (connectors.to) sides.push(['to', connectors.to])
    const found: { at: number; ref: OperationRef }[] = []
    for (const [side, invoker] of sides) {
        for (const operation of invoker.operations) {
            const match = new RegExp(`(?<![\\w.])${escapeRegExp(operation.name)}(?![\\w]|\\.\\w)`).exec(text)
            if (match && !found.some((entry) => entry.ref.operation.name === operation.name)) {
                found.push({ at: match.index, ref: { side, invoker, operation } })
            }
        }
    }
    return found.sort((left, right) => left.at - right.at).map((entry) => entry.ref)
}

type Builder = {
    connectors: WorkflowConnectors
    nextId: () => string
    /** Every method created so far, so a loop can find the step whose result it iterates. */
    methods: { id: string; operation: string }[]
    notes: string[]
}

function methodNode(builder: Builder, op: OperationRef, text: string): SkeletonNode {
    const id = builder.nextId()
    builder.methods.push({ id, operation: op.operation.name })
    return { id, kind: 'method', text, op }
}

/** A loop or if line names the lists it reads first; what it runs comes after its colon ("…: create it with X"). */
function actionAfterColon(builder: Builder, text: string): OperationRef[] {
    const colon = text.lastIndexOf(':')
    return colon < 0 ? [] : operationsIn(text.slice(colon + 1), builder.connectors).slice(0, 1)
}

/** Builds the nodes for the steps at `depth`, consuming deeper steps as their children. */
function buildLevel(builder: Builder, steps: PlanStep[], start: number, depth: number): { nodes: SkeletonNode[]; next: number } {
    const nodes: SkeletonNode[] = []
    let index = start
    while (index < steps.length) {
        const step = steps[index]
        if (!step || step.depth < depth) break
        index += 1
        const ops = operationsIn(step.text, builder.connectors)
        const childStart = index
        const collectChildren = () => {
            const children = buildLevel(builder, steps, childStart, step.depth + 1)
            index = children.next
            return children.nodes
        }

        if (LOOP_RE.test(step.text)) {
            // The list comes from the most recent earlier step that ran the operation the line names first.
            const source = ops.map((op) => [...builder.methods].reverse().find((method) => method.operation === op.operation.name))
                .find((method) => method !== undefined)
            if (!source) throw new Error(`Plan step "${step.text}" does not name the operation whose result it loops over`)
            const id = builder.nextId()
            const inline = actionAfterColon(builder, step.text).filter((op) => op.operation.name !== source.operation)
                .map((op) => methodNode(builder, op, step.text))
            nodes.push({ id, kind: 'loop', text: step.text, sourceId: source.id, sourceOperation: source.operation,
                body: [...inline, ...collectChildren()] })
        } else if (IF_RE.test(step.text)) {
            const id = builder.nextId()
            const inline = actionAfterColon(builder, step.text).map((op) => methodNode(builder, op, step.text))
            nodes.push({ id, kind: 'if', text: step.text, then: [...inline, ...collectChildren()] })
        } else if (ops[0] && !ASSIGNMENT_RE.test(step.text)) {
            // The first operation is the step's action; later ones name earlier results it uses ("… using the X result").
            nodes.push(methodNode(builder, ops[0], step.text))
            nodes.push(...collectChildren())
        } else {
            builder.notes.push(step.text)
            nodes.push(...collectChildren())
        }
    }
    return { nodes, next: index }
}

/** The workflow's fixed structure taken from a reviewed plan; throws when a loop cannot be tied to its list. */
export function buildSkeleton(steps: PlanStep[], connectors: WorkflowConnectors): PlanSkeleton {
    let counter = 0
    const builder: Builder = { connectors, nextId: () => `s${++counter}`, methods: [], notes: [] }
    const { nodes } = buildLevel(builder, steps, 0, 0)
    if (!nodes.some((node) => node.kind === 'method')) throw new Error('The plan does not name any operation of the selected connectors')
    return { nodes, notes: builder.notes }
}

function tupleOf(items: z.ZodType[]): z.ZodType {
    const [first, ...rest] = items
    return first === undefined ? z.array(z.never()).max(0) : z.tuple([first, ...rest])
}

function nodeSchema(node: SkeletonNode): z.ZodType {
    switch (node.kind) {
        case 'method':
            return operationStepSchema(node.op.side, node.op.invoker, node.op.operation, node.id)
        case 'loop':
            return z.object({
                id: z.literal(node.id), kind: z.literal('loop'),
                over: z.object({ step: z.literal(node.sourceId), path: z.string() }),
                body: tupleOf(node.body.map(nodeSchema)),
            })
        case 'if':
            return z.object({ id: z.literal(node.id), kind: z.literal('if'), condition: conditionSchema, then: tupleOf(node.then.map(nodeSchema)) })
        default: {
            const _exhaustive: never = node
            return _exhaustive
        }
    }
}

/** Decoding under this schema can only fill values: ids, kinds, operations, loop sources and nesting are fixed. */
export function buildSkeletonSchema(skeleton: PlanSkeleton): z.ZodType {
    return z.object({ steps: tupleOf(skeleton.nodes.map(nodeSchema)) })
}

function describeNode(node: SkeletonNode, depth: number): string[] {
    const pad = '  '.repeat(depth)
    switch (node.kind) {
        case 'method':
            return [`${pad}${node.id}: method ${node.op.operation.name} (connector "${node.op.side}") - ${node.text}`]
        case 'loop':
            return [`${pad}${node.id}: loop over the ${node.sourceOperation} result of ${node.sourceId} - ${node.text}`,
                ...node.body.flatMap((child) => describeNode(child, depth + 1))]
        case 'if':
            return [`${pad}${node.id}: if - ${node.text}`, ...node.then.flatMap((child) => describeNode(child, depth + 1))]
        default: {
            const _exhaustive: never = node
            return _exhaustive
        }
    }
}

/** The user message for a skeleton build: the request, the fixed steps, and what is left to fill in. */
export function describeSkeleton(request: string, skeleton: PlanSkeleton): string {
    const notes = skeleton.notes.length ? `\n\nAlso apply:\n${skeleton.notes.map((note) => `- ${note}`).join('\n')}` : ''
    return `${request}

The workflow's steps are fixed (ids, nesting and operations below). Fill in only the values: each loop's "over.path"
(the list inside the source step's response), each if's condition, and each method's params and fields.
${skeleton.nodes.flatMap((node) => describeNode(node, 0)).join('\n')}${notes}`
}
