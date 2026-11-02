import { buildWorkflowIndexes } from '@features/workflow/api/connectionPayload'
import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types'

export type GuideNodeResolution =
    | { kind: 'found'; nodeId: string; label: string }
    | { kind: 'no-methods' }
    | { kind: 'no-match'; method: string }

const isMethodNode = (node: WorkflowNodeModel) => node.data.kind === 'connector' || node.data.kind === 'system'

/** Spoken names arrive as "get customers", typed ones as "getCustomers": compare letters and digits only. */
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

export const methodLabel = (node: WorkflowNodeModel) =>
    node.data.subtitle || node.data.methodConfig?.name || node.data.title

const namesOf = (node: WorkflowNodeModel) =>
    [node.data.subtitle, node.data.methodConfig?.name].filter((name): name is string => !!name).map(normalize)

/** Every name a method can be called by — its label and its operation — for the AI to choose from. */
export const guideMethodNames = (nodes: WorkflowNodeModel[]): string[] =>
    [...new Set(nodes.filter(isMethodNode).flatMap(node =>
        [node.data.subtitle, node.data.methodConfig?.name].filter((name): name is string => !!name?.trim())))]

/** Tree-path order: `1` < `1_0` < `1_2_0` < `2`; a node not yet linked into the graph sorts last. */
const compareIndexes = (left: string | undefined, right: string | undefined) => {
    if (left === right) return 0
    if (left === undefined) return 1
    if (right === undefined) return -1
    const a = left.split('_').map(Number)
    const b = right.split('_').map(Number)
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
        if (a[i] !== b[i]) return a[i] - b[i]
    }
    return a.length - b.length
}

/**
 * Which method a guide is about. A named method is the first match in the tree; without a
 * name it is the selected method, and with nothing selected, the first method in the tree.
 * An exact name beats a partial one, so "get" never wins over a method called "get".
 */
export function resolveGuideNode(
    nodes: WorkflowNodeModel[],
    edges: WorkflowEdgeModel[],
    method?: string,
): GuideNodeResolution {
    const indexes = buildWorkflowIndexes(nodes, edges)
    const methods = nodes.filter(isMethodNode)
        .sort((left, right) => compareIndexes(indexes.get(left.id), indexes.get(right.id)))
    if (methods.length === 0) return { kind: 'no-methods' }

    const found = (node: WorkflowNodeModel): GuideNodeResolution => ({ kind: 'found', nodeId: node.id, label: methodLabel(node) })
    const wanted = normalize(method ?? '')
    if (wanted) {
        const match = methods.find(node => namesOf(node).includes(wanted))
            ?? methods.find(node => namesOf(node).some(name => name.includes(wanted)))
        return match ? found(match) : { kind: 'no-match', method: method?.trim() ?? '' }
    }
    return found(methods.find(node => node.selected) ?? methods[0])
}
