import { z } from 'zod'
import { type WorkflowConnectors, operationStepSchema } from '../dsl/buildConstrainedSchema.ts'
import { type ConnectorSide, conditionSchema } from '../dsl/workflowDsl.schema.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import { type FieldRule, type FieldRuleLine, parseFieldRuleLine, ruleAppliesTo } from './planFieldRules.ts'
import type { PlanStep } from './workflowPlan.schema.ts'

type OperationRef = { side: ConnectorSide; invoker: Invoker; operation: InvokerOperation }

export type SkeletonNode =
    | { id: string; kind: 'method'; text: string; op: OperationRef }
    | { id: string; kind: 'loop'; text: string; sourceId: string; sourceOperation: string; body: SkeletonNode[] }
    | { id: string; kind: 'if'; text: string; then: SkeletonNode[] }

export type PlanSkeleton = {
    nodes: SkeletonNode[]
    /** Plan lines that are not a step and not a field rule (remarks), passed on as instructions. */
    notes: string[]
    /** "<Operation> set <field> = <value>" lines, attached to the methods they name. */
    ruleLines: FieldRuleLine[]
}

/** The field rules for one operation; a later line overrides an earlier one for the same field. */
export function rulesFor(skeleton: PlanSkeleton, operation: string): FieldRule[] {
    const byField = new Map<string, FieldRule>()
    for (const line of skeleton.ruleLines) {
        if (!ruleAppliesTo(line, operation)) continue
        for (const rule of line.rules) byField.set(rule.field, rule)
    }
    return [...byField.values()]
}

/** Every distinct script rule, so examples are looked up once per rule rather than once per method. */
export function scriptRules(skeleton: PlanSkeleton): FieldRule[] {
    const byText = new Map<string, FieldRule>()
    for (const line of skeleton.ruleLines) {
        for (const rule of line.rules) if (rule.isScript) byText.set(`${rule.field} = ${rule.value}`, rule)
    }
    return [...byText.values()]
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
    ruleLines: FieldRuleLine[]
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
            const ruleLine = parseFieldRuleLine(step.text, ops.map((op) => op.operation.name))
            if (ruleLine) builder.ruleLines.push(ruleLine)
            else builder.notes.push(step.text)
            nodes.push(...collectChildren())
        }
    }
    return { nodes, next: index }
}

/** The workflow's fixed structure taken from a reviewed plan; throws when a loop cannot be tied to its list. */
export function buildSkeleton(steps: PlanStep[], connectors: WorkflowConnectors): PlanSkeleton {
    let counter = 0
    const builder: Builder = { connectors, nextId: () => `s${++counter}`, methods: [], notes: [], ruleLines: [] }
    const { nodes } = buildLevel(builder, steps, 0, 0)
    if (!nodes.some((node) => node.kind === 'method')) throw new Error('The plan does not name any operation of the selected connectors')
    return { nodes, notes: builder.notes, ruleLines: builder.ruleLines }
}

function tupleOf(items: z.ZodType[]): z.ZodType {
    const [first, ...rest] = items
    return first === undefined ? z.array(z.never()).max(0) : z.tuple([first, ...rest])
}

function nodeSchema(skeleton: PlanSkeleton, node: SkeletonNode): z.ZodType {
    const child = (nested: SkeletonNode) => nodeSchema(skeleton, nested)
    switch (node.kind) {
        case 'method': {
            // The plan decides where transformations go: scripts on the fields it marks, plain values elsewhere.
            const scriptFields = new Set(rulesFor(skeleton, node.op.operation.name).filter((rule) => rule.isScript).map((rule) => rule.field))
            return operationStepSchema(node.op.side, node.op.invoker, node.op.operation, node.id, { scriptFields })
        }
        case 'loop':
            return z.object({
                id: z.literal(node.id), kind: z.literal('loop'),
                over: z.object({ step: z.literal(node.sourceId), path: z.string() }),
                body: tupleOf(node.body.map(child)),
            })
        case 'if':
            return z.object({ id: z.literal(node.id), kind: z.literal('if'), condition: conditionSchema, then: tupleOf(node.then.map(child)) })
        default: {
            const _exhaustive: never = node
            return _exhaustive
        }
    }
}

/** Decoding under this schema can only fill values: ids, kinds, operations, loop sources and nesting are fixed. */
export function buildSkeletonSchema(skeleton: PlanSkeleton): z.ZodType {
    return z.object({ steps: tupleOf(skeleton.nodes.map((node) => nodeSchema(skeleton, node))) })
}
