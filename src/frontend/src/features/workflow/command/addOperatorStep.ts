import type { WorkflowOperatorKind } from '../types/workflow.types';
import { insertionPoint, lastMainStepId, type InsertPosition } from './insertionPoint';
import { workflowCommandBridgeStore } from './workflowCommandBridge';

export type AddOperatorRequest = {
	kind: WorkflowOperatorKind;
	/** The step to add after or before; null for "the selected step, else the end of the workflow". */
	anchorNodeId: string | null;
	position: InsertPosition;
};

export type AddOperatorResult =
	| { kind: 'added'; nodeId: string }
	| { kind: 'not-editable' }
	| { kind: 'no-place' };

/** Adds an if or a loop the way the "+" would, and brings it into view; undone like any other edit. */
export function addOperatorStep({ kind, anchorNodeId, position }: AddOperatorRequest): AddOperatorResult {
	const bridge = workflowCommandBridgeStore.getState();
	if (!bridge.isActive || !bridge.isEditable()) return { kind: 'not-editable' };
	const nodes = bridge.getNodes();
	const edges = bridge.getEdges();
	const selected = nodes.find((node) => node.selected && node.type !== 'start' && node.type !== 'comment');
	const anchor = anchorNodeId ?? selected?.id ?? lastMainStepId(nodes, edges);
	const point = anchor ? insertionPoint(nodes, edges, anchor, anchorNodeId ? position : 'after') : null;
	if (!point) return { kind: 'no-place' };
	const nodeId = bridge.addStep({ ...point, kind });
	if (!nodeId) return { kind: 'no-place' };
	bridge.selectNode(nodeId);
	requestAnimationFrame(() => bridge.centerOnNode(nodeId));
	return { kind: 'added', nodeId };
}
