import type { WorkflowEdgeModel, WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import { collectMappingTargets } from '@features/ai-assistant/mapping/mappingCandidates'
import { methodLabel, methodsInWorkflowOrder, resolveGuideNode } from './resolveGuideNode'
import type { GuidePart } from './workflowGuide.store'

const REFERENCE_RE = /#[0-9A-Fa-f]{6}\.\((?:response|request)\)/
/** An array element's row prints its index, which says nothing to point at. */
const isIndex = (name: string) => /^\d+$/.test(name)

/** The key of the first field in the method's body or headers holding a reference; null when none does. */
export function referencedField(node: WorkflowNodeModel, part: GuidePart): string | null {
    const config = node.data.methodConfig
    const source = part === 'header' ? config?.headers : config?.body
    const target = collectMappingTargets(source).find((leaf) => !isIndex(leaf.name) && REFERENCE_RE.test(leaf.current))
    return target?.name ?? null
}

export type TransformationResolution =
    | { kind: 'found'; nodeId: string; label: string; field: string | null }
    | { kind: 'no-methods' }
    | { kind: 'no-match'; method: string }
    | { kind: 'no-references' }

/**
 * The method the transformation guide shows. A named method is the first match in the tree, as for every guide,
 * shown even without a reference (the guide then says what is missing). Unnamed, it prefers what can be shown to the
 * end: the selected method if it has a referenced field, else the first one in the tree that does.
 */
export function resolveTransformationNode(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], part: GuidePart,
    method?: string): TransformationResolution {
    if (method?.trim()) {
        const named = resolveGuideNode(nodes, edges, method)
        if (named.kind !== 'found') return named
        const node = nodes.find((candidate) => candidate.id === named.nodeId)
        return { kind: 'found', nodeId: named.nodeId, label: named.label, field: node ? referencedField(node, part) : null }
    }
    const methods = methodsInWorkflowOrder(nodes, edges)
    if (methods.length === 0) return { kind: 'no-methods' }
    const selected = methods.find((node) => node.selected && referencedField(node, part))
    const withReference = selected ?? methods.find((node) => referencedField(node, part))
    if (!withReference) return { kind: 'no-references' }
    return { kind: 'found', nodeId: withReference.id, label: methodLabel(withReference), field: referencedField(withReference, part) }
}
