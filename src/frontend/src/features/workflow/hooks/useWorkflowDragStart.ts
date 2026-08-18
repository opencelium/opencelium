import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDragSnapshot } from '../drag-drop/workflowPage.types';
import { sanitizeGraphEdges, sanitizeGraphNodes } from '../drag-drop/workflowPageGraph.utils';
import { stabilizeMethodColors } from '../drag-drop/workflowPageNodes.utils';
import { getDragSubtreeNodeIds } from '../drag-drop/workflowDropTarget.utils';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	setIsDragging: Dispatch<SetStateAction<boolean>>;
	reactFlowInstance: MutableRefObject<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>;
	dragSnapshot: MutableRefObject<WorkflowDragSnapshot | null>;
	positionLock: MutableRefObject<Set<string> | null>;
	multiDrag: MutableRefObject<boolean>;
};

export const useWorkflowDragStart = ({ nodes, edges, setNodes, setIsDragging,
	reactFlowInstance, dragSnapshot, positionLock, multiDrag }: Params) =>
	(event: any, node: WorkflowNodeModel) => {
		setIsDragging(true);
		try {
			const selected = nodes.filter((item) => item.selected && item.type !== 'start');
			if (selected.length > 1 && selected.some((item) => item.id === node.id)) {
				multiDrag.current = true;
				dragSnapshot.current = null;
				positionLock.current = null;
				return;
			}
			multiDrag.current = false;
			const stableNodes = sanitizeGraphNodes(stabilizeMethodColors(nodes));
			const stableEdges = sanitizeGraphEdges(stableNodes, edges);
			const draggedNode = stableNodes.find((item) => item.id === node.id);
			if (!draggedNode) {
				dragSnapshot.current = null;
				positionLock.current = null;
				return;
			}
			const draggedIds = getDragSubtreeNodeIds(node.id, stableNodes, stableEdges);
			positionLock.current = new Set(draggedIds);
			const instance = reactFlowInstance.current;
			const pointerOffsetFromRoot = instance
				&& typeof event?.clientX === 'number' && typeof event?.clientY === 'number'
				? (() => {
					const pointer = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
					return {
						x: pointer.x - draggedNode.position.x,
						y: pointer.y - draggedNode.position.y,
					};
				})()
				: undefined;
			dragSnapshot.current = {
				nodes: stableNodes,
				edges: stableEdges,
				mode: event?.ctrlKey ? 'copy' : 'move',
				operatorConfigs: new Map(stableNodes
					.filter((item) => ['if', 'loop'].includes(item.type ?? '')
						&& item.data.conditionConfig)
					.map((item) => [item.id, item.data.conditionConfig as ConditionConfig])),
				highlightedNodeIds: new Set<string>(),
				highlightedEdgeIds: new Set<string>(),
				pointerOffsetFromRoot,
				lastGhostRootPosition: { ...draggedNode.position },
			};
			setNodes((current) => current.map((item) => ({
				...item,
				data: { ...item.data, highlighted: false,
					hideAddControls: draggedIds.has(item.id),
					suppressHoverAddControls: draggedIds.has(item.id),
					dragSourceMoving: false, dragSourceFaint: false },
			})));
		} catch {
			dragSnapshot.current = null;
			positionLock.current = null;
		}
	};
