import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { getWorkflowSubtree } from '../utils/graph.subtreeClone';
import { normalizeReferenceColor } from '../utils/graph.referenceColors';

export const WORKFLOW_CLIPBOARD_KEY = 'opencelium.workflowClipboard.v1';
export type WorkflowClipboard = {
    version: 1;
    sourceWorkflowId: string;
    rootIds: string[];
    nodes: WorkflowNodeModel[];
    edges: WorkflowEdgeModel[];
    fieldBindings: unknown[];
};

export function createWorkflowClipboard(sourceWorkflowId: string, rootIds: string[],
    nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], fieldBindings: unknown[] = []): WorkflowClipboard {
    const ids = new Set(rootIds.flatMap((id) => getWorkflowSubtree(id, nodes, edges).nodes.map((node) => node.id)));
    const selected = nodes.filter((node) => ids.has(node.id) ||
        (node.type === 'comment' && ids.has(node.data.comment?.anchorNodeId ?? '')));
    const colors = new Set(selected.map((node) => normalizeReferenceColor(node.data.color)));
    const bindings = fieldBindings.filter((binding) => {
        const targets = (binding as { to?: { color?: string }[] })?.to;
        return targets?.some((target) => colors.has(normalizeReferenceColor(target.color)));
    });
    return JSON.parse(JSON.stringify({version: 1, sourceWorkflowId, rootIds,
        nodes: selected, edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
        fieldBindings: bindings}));
}

export function parseWorkflowClipboard(raw: string | null): WorkflowClipboard | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw);
        if (value?.version !== 1 || typeof value.sourceWorkflowId !== 'string' ||
            !Array.isArray(value.rootIds) || !value.rootIds.every((id: unknown) => typeof id === 'string') ||
            !Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.fieldBindings)) return null;
        if (!value.nodes.every((node: WorkflowNodeModel) => typeof node?.id === 'string' &&
            node.data && node.position && typeof node.type === 'string')) return null;
        const ids = new Set(value.nodes.map((node: WorkflowNodeModel) => node.id));
        if (!value.rootIds.every((id: string) => ids.has(id)) ||
            !value.edges.every((edge: WorkflowEdgeModel) => ids.has(edge?.source) && ids.has(edge?.target))) return null;
        return value;
    } catch {
        return null;
    }
}
