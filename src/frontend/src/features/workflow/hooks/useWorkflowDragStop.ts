import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { UseWorkflowPageOptions, WorkflowDragSnapshot } from '../drag-drop/workflowPage.types';
import { moveOrCopyWorkflowNodes } from '../utils/graph.dragDrop';
import { sanitizeGraphEdges, sanitizeGraphNodes } from '../drag-drop/workflowPageGraph.utils';
import { clearDragFlags, clearDragPreviewNodes, clearEdgeDragFlags } from '../drag-drop/workflowPageNodes.utils';
import { computeGhostRootPosition } from '../drag-drop/workflowDragCalculations.utils';
import { positionDragCommit, resolveDragCommit } from '../drag-drop/workflowDragCommit.utils';

type Params = {
	options: UseWorkflowPageOptions;
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	setEdges: Dispatch<SetStateAction<WorkflowEdgeModel[]>>;
	setIsDragging: Dispatch<SetStateAction<boolean>>;
	reactFlowInstance: MutableRefObject<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>;
	dragSnapshot: MutableRefObject<WorkflowDragSnapshot | null>;
	positionLock: MutableRefObject<Set<string> | null>;
	multiDrag: MutableRefObject<boolean>;
	clearPreview: (snapshot: WorkflowDragSnapshot) => void;
	commitFreeReposition: (snapshot: WorkflowDragSnapshot, sourceNodeId: string) => void;
};

export const useWorkflowDragStop = ({ options, setNodes, setEdges, setIsDragging,
	reactFlowInstance, dragSnapshot, positionLock, multiDrag, clearPreview,
	commitFreeReposition }: Params) => async (event: any, node: WorkflowNodeModel) => {
	setIsDragging(false);
	if (multiDrag.current) {
		multiDrag.current = false;
		positionLock.current = null;
		return;
	}
	const snapshot = dragSnapshot.current;
	dragSnapshot.current = null;
	if (!snapshot) {
		positionLock.current = null;
		return;
	}
	if (node.type === 'start') {
		setNodes((current) => sanitizeGraphNodes(clearDragFlags(clearDragPreviewNodes(current))));
		positionLock.current = null;
		return;
	}

	try {
		const releasePosition = computeGhostRootPosition(
			reactFlowInstance.current, event, snapshot,
		);
		if (releasePosition) snapshot.lastGhostRootPosition = releasePosition;
		const { target: commitTarget, layout: commitLayout } = resolveDragCommit(
			reactFlowInstance.current, event, node.id, snapshot, options.fieldBindings,
		);
		if (!commitTarget || !commitLayout) {
			if (snapshot.mode === 'copy') clearPreview(snapshot);
			else commitFreeReposition(snapshot, node.id);
			return;
		}
		const dropArgs = { sourceNodeId: node.id, target: commitTarget,
			mode: snapshot.mode, nodes: snapshot.nodes, edges: snapshot.edges,
			fieldBindings: options.fieldBindings };
		let next = moveOrCopyWorkflowNodes(dropArgs);
		if (next.invalidReferences.length > 0) {
			clearPreview(snapshot);
			const accepted = await options.confirmDependencyDrop?.(next.invalidReferences);
			if (!accepted) {
				clearPreview(snapshot);
				return;
			}
			next = moveOrCopyWorkflowNodes({ ...dropArgs, cleanInvalid: true });
		}
		const positioned = positionDragCommit(
			node.id, snapshot, next.nodes, next.idMap, commitLayout,
		);
		const finalNodes = sanitizeGraphNodes(clearDragFlags(positioned));
		setNodes(finalNodes);
		setEdges(sanitizeGraphEdges(finalNodes, clearEdgeDragFlags(next.edges)));
		options.onFieldBindingsChange?.(next.fieldBindings);
	} catch {
		clearPreview(snapshot);
	} finally {
		requestAnimationFrame(() => { positionLock.current = null; });
	}
};
