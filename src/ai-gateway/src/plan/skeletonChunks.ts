import { z } from 'zod'
import { operationStepSchema } from '../dsl/buildConstrainedSchema.ts'
import { type Condition, type MethodStep, type StepRef, type WorkflowDsl, type WorkflowStep, conditionSchema } from '../dsl/workflowDsl.schema.ts'
import { type PlanSkeleton, type SkeletonNode, rulesFor } from './planSkeleton.ts'

/** What one answer fills for a step: a method's params and fields, a loop's list, an if's condition. Never children. */
export type StepFill =
    | MethodStep
    | { id: string; kind: 'loop'; over: StepRef }
    | { id: string; kind: 'if'; condition: Condition }

/** Every step of the skeleton in document order, loops and ifs before the steps inside them. */
export function flattenSkeleton(nodes: SkeletonNode[]): SkeletonNode[] {
    return nodes.flatMap((node) => {
        switch (node.kind) {
            case 'method': return [node]
            case 'loop': return [node, ...flattenSkeleton(node.body)]
            case 'if': return [node, ...flattenSkeleton(node.then)]
            default: {
                const _exhaustive: never = node
                return _exhaustive
            }
        }
    })
}

/** Consecutive runs of at most `size` steps; a loop and the steps inside it may land in different chunks. */
export function chunkSkeleton(skeleton: PlanSkeleton, size: number): SkeletonNode[][] {
    const steps = flattenSkeleton(skeleton.nodes)
    const chunks: SkeletonNode[][] = []
    for (let start = 0; start < steps.length; start += size) chunks.push(steps.slice(start, start + size))
    return chunks
}

function fillSchema(skeleton: PlanSkeleton, node: SkeletonNode): z.ZodType {
    switch (node.kind) {
        case 'method': {
            const rules = rulesFor(skeleton, node.op.operation.name)
            const scriptFields = new Set(rules.filter((rule) => rule.isScript).map((rule) => rule.field))
            return operationStepSchema(node.op.side, node.op.invoker, node.op.operation, node.id,
                { scriptFields, extraFields: rules.map((rule) => rule.field) })
        }
        case 'loop':
            return z.object({ id: z.literal(node.id), kind: z.literal('loop'), over: z.object({ step: z.literal(node.sourceId), path: z.string() }) })
        case 'if':
            return z.object({ id: z.literal(node.id), kind: z.literal('if'), condition: conditionSchema })
        default: {
            const _exhaustive: never = node
            return _exhaustive
        }
    }
}

/** An answer for exactly these steps, in this order; ids, kinds, operations and loop sources stay as the plan fixed them. */
export function buildChunkSchema(skeleton: PlanSkeleton, chunk: SkeletonNode[]): z.ZodType<{ steps: StepFill[] }> {
    const [first, ...rest] = chunk.map((node) => fillSchema(skeleton, node))
    if (!first) throw new Error('An empty chunk has nothing to fill')
    return z.object({ steps: z.tuple([first, ...rest]) }) as unknown as z.ZodType<{ steps: StepFill[] }>
}

/** The workflow from the skeleton and the filled steps; undefined while a step is still unfilled. */
export function assembleSkeleton(skeleton: PlanSkeleton, fills: ReadonlyMap<string, StepFill>): WorkflowDsl | undefined {
    let isComplete = true
    const build = (nodes: SkeletonNode[]): WorkflowStep[] => nodes.flatMap((node): WorkflowStep[] => {
        const fill = fills.get(node.id)
        if (!fill || fill.kind !== node.kind) {
            isComplete = false
            return []
        }
        switch (fill.kind) {
            case 'method': return [fill]
            case 'loop': return node.kind === 'loop' ? [{ ...fill, body: build(node.body) }] : []
            case 'if': return node.kind === 'if' ? [{ ...fill, then: build(node.then) }] : []
            default: {
                const _exhaustive: never = fill
                return _exhaustive
            }
        }
    })
    const steps = build(skeleton.nodes)
    return isComplete ? { steps } : undefined
}
