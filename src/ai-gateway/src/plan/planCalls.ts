import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { OperationCall } from '../examples/operationUsages.ts'
import { type OperationRef, type PlanSkeleton, type SkeletonNode, operationsIn, rulesFor } from './planSkeleton.ts'

const toCall = (ref: OperationRef, connectors: WorkflowConnectors, text: string): OperationCall => ({
    side: ref.side,
    invoker: ref.invoker,
    operation: ref.operation.name,
    counterpart: ref.side === 'from' ? connectors.to : connectors.from,
    text,
})

/** Every call of a plan-fixed workflow, with its step text and field rules as the words its usages are ranked by. */
export function skeletonCalls(skeleton: PlanSkeleton, connectors: WorkflowConnectors): OperationCall[] {
    const walk = (nodes: SkeletonNode[]): OperationCall[] => nodes.flatMap((node) => {
        switch (node.kind) {
            case 'method': {
                const rules = rulesFor(skeleton, node.op.operation.name).map((rule) => `${rule.field} ${rule.value}`)
                return [toCall(node.op, connectors, [node.text, ...rules].join(' '))]
            }
            case 'loop': return walk(node.body)
            case 'if': return walk(node.then)
            default: {
                const _exhaustive: never = node
                return _exhaustive
            }
        }
    })
    return walk(skeleton.nodes)
}

/** The operations named in free text (a plan that could not be read as steps, or a request without a plan). */
export function textCalls(lines: string[], connectors: WorkflowConnectors): OperationCall[] {
    return lines.flatMap((line) => operationsIn(line, connectors).map((ref) => toCall(ref, connectors, line)))
}
