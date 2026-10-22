import type { WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowIssueTone } from './workflowProblems';

/**
 * Rings the step a problem list points at in its problem's tone. Applied to the
 * nodes handed to the canvas only, never to the graph state, so the ring cannot
 * reach the undo history or a saved payload. Every other node keeps its identity,
 * which keeps the canvas' per-node cache warm.
 */
export const applyProblemFocus = (nodes: WorkflowNodeModel[], nodeId: string | null,
	tone: WorkflowIssueTone | null): WorkflowNodeModel[] => {
	if (!nodeId || !tone) return nodes;
	return nodes.map((node) => node.id === nodeId
		? { ...node, data: { ...node.data, problemFocus: tone } } as WorkflowNodeModel
		: node);
};
