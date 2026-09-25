import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDragSnapshot } from '../drag-drop/workflowPage.types';
import { sanitizeGraphEdges, sanitizeGraphNodes } from '../drag-drop/workflowPageGraph.utils';
import { clearDragPreviewEdges, clearEdgeDragFlags } from '../drag-drop/workflowPageNodes.utils';
import { findWorkflowDropTarget, resolveStickyDropTarget } from '../drag-drop/workflowDropTarget.utils';
import { buildFreeDragNodes, buildPlaceholderEdges, buildPlaceholderNodes,
	buildSourceDimmedNodes } from '../drag-drop/workflowDragPreview.utils';
import { buildInsertionPreviewEdges, buildInsertionPreviewNodes } from '../drag-drop/workflowInsertionPreview.utils';
import { buildPreviewGraphForTarget, computeGhostRootPosition } from '../drag-drop/workflowDragCalculations.utils';
import { computeInsertionLayout } from '../drag-drop/workflowInsertionLayout';
import { withCommentOffsetFromPosition } from '../utils/commentAnchor';
import { moveWorkflowNodeGroup } from '../utils/graph.dragDrop';

type Snapshot = WorkflowDragSnapshot;
type Params = {
	fieldBindings?: any[];
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	reactFlowInstance: MutableRefObject<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>;
	dragSnapshot: MutableRefObject<Snapshot | null>;
	multiDrag: MutableRefObject<boolean>;
	updateNodes: (snapshot: Snapshot, key: string, build: () => WorkflowNodeModel[]) => void;
	updateEdges: (snapshot: Snapshot, key: string, edges: WorkflowEdgeModel[]) => void;
	clearPreview: (snapshot: Snapshot) => void;
};

const isFinitePosition = (position?: { x?: number; y?: number }) =>
	Number.isFinite(position?.x) && Number.isFinite(position?.y);

export const useWorkflowDragMove = ({ fieldBindings, setNodes, reactFlowInstance,
	dragSnapshot, multiDrag, updateNodes, updateEdges, clearPreview }: Params) =>
	(event: any, node: WorkflowNodeModel) => {
		if (multiDrag.current) {
			const snapshot = dragSnapshot.current;
			if (!snapshot) return;
			const snapshotRoot = snapshot.nodes.find((item) => item.id === node.id);
			const rootPosition = computeGhostRootPosition(
				reactFlowInstance.current, event, snapshot,
			) ?? node.position;
			const delta = snapshotRoot && isFinitePosition(rootPosition)
				? { x: rootPosition.x - snapshotRoot.position.x,
					y: rootPosition.y - snapshotRoot.position.y }
				: { x: 0, y: 0 };
			const dropTarget = resolveStickyDropTarget(snapshot, findWorkflowDropTarget(
				reactFlowInstance.current, event, node.id, snapshot.nodes, snapshot.edges,
				snapshot.draggedNodeIds,
			));
			if (!dropTarget) {
				const draggedIds = snapshot.draggedNodeIds ?? new Set<string>();
				setNodes(snapshot.nodes.map((item) => ({
					...item,
					position: draggedIds.has(item.id)
						? { x: item.position.x + delta.x, y: item.position.y + delta.y }
						: item.position,
					data: { ...item.data, highlighted: false, dropTarget: false,
						dropInvalid: false, dragGhost: false, dropPlaceholder: false,
						dragSourceMoving: false, dragSourceFaint: false },
				})));
				updateEdges(snapshot, 'multi:free', clearEdgeDragFlags(snapshot.edges));
				return;
			}
			const draggedIds = snapshot.draggedNodeIds ?? new Set<string>();
			const preview = moveWorkflowNodeGroup({
				sourceNodeIds: snapshot.multiRootIds ?? [],
				target: dropTarget.target,
				nodes: snapshot.nodes,
				edges: snapshot.edges,
				fieldBindings,
			});
			const invalid = preview.invalidReferences.length > 0;
			const previewById = new Map(preview.nodes.map((item) => [item.id, item]));
			const previewNodes = [
				...snapshot.nodes.filter((item) => !draggedIds.has(item.id)).map((item) => ({
					...item,
					position: previewById.get(item.id)?.position ?? item.position,
					data: { ...item.data, highlighted: false, dropTarget: false,
						dropInvalid: false, dragGhost: false, dropPlaceholder: false },
				})),
				...buildSourceDimmedNodes(snapshot.nodes, draggedIds, true),
				...buildPlaceholderNodes(preview.nodes, draggedIds, invalid),
			];
			const previewEdges = [
				...preview.edges.filter((edge) => !draggedIds.has(edge.source)
					&& !draggedIds.has(edge.target)).map((edge) => ({
						...edge,
						data: { ...edge.data, highlighted: false, dropTarget: false,
							dropInvalid: false, dragGhost: false, dropPlaceholder: false },
					})),
				...buildPlaceholderEdges(preview.edges, draggedIds, invalid),
			];
			const key = `multi:${dropTarget.target.nodeId}:${dropTarget.target.direction}:${invalid}`;
			updateNodes(snapshot, key, () => sanitizeGraphNodes(previewNodes));
			updateEdges(snapshot, key, sanitizeGraphEdges(previewNodes, previewEdges));
			return;
		}
		if (node.type === 'comment') {
			setNodes((current) => withCommentOffsetFromPosition(current, node.id, node.position));
			return;
		}
		const snapshot = dragSnapshot.current;
		if (!snapshot || node.type === 'start') return;
		try {
			const snapshotRoot = snapshot.nodes.find((item) => item.id === node.id);
			if (!snapshotRoot) return;
			const rootPosition = computeGhostRootPosition(
				reactFlowInstance.current, event, snapshot,
			) ?? node.position ?? snapshotRoot.position;
			if (isFinitePosition(rootPosition)) snapshot.lastGhostRootPosition = rootPosition;
			const delta = isFinitePosition(rootPosition)
				? { x: rootPosition.x - snapshotRoot.position.x,
					y: rootPosition.y - snapshotRoot.position.y }
				: { x: 0, y: 0 };
			const dropTarget = resolveStickyDropTarget(snapshot, findWorkflowDropTarget(
				reactFlowInstance.current, event, node.id, snapshot.nodes, snapshot.edges,
			));
			if (!dropTarget) {
				snapshot.activeDropTarget = undefined;
				snapshot.lastInsertionPreview = undefined;
				snapshot.previewNodeKey = undefined;
				const freeNodes = sanitizeGraphNodes(
					buildFreeDragNodes(node.id, snapshot.nodes, delta, snapshot.draggedNodeIds),
				);
				setNodes(freeNodes);
				updateEdges(snapshot, `${snapshot.mode}:free`, sanitizeGraphEdges(
					freeNodes,
					clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges)),
				));
				return;
			}
			const { preview, invalid } = buildPreviewGraphForTarget(
				node.id, dropTarget.target, snapshot.mode,
				snapshot.nodes, snapshot.edges, fieldBindings,
			);
			const layout = computeInsertionLayout(
				dropTarget, node.id, snapshot.nodes, snapshot.edges, preview, snapshot.mode, false,
			);
			snapshot.lastInsertionPreview = {
				sourceNodeId: node.id,
				targetNodeId: dropTarget.target.nodeId,
				direction: dropTarget.target.direction,
				layout,
			};
			const key = `${snapshot.mode}:${dropTarget.target.nodeId}:${dropTarget.target.direction}:${invalid}`;
			const previewNodes = sanitizeGraphNodes(
				buildInsertionPreviewNodes(layout, snapshot.nodes, preview, invalid),
			);
			const previewEdges = sanitizeGraphEdges(previewNodes,
				buildInsertionPreviewEdges(
					node.id, snapshot.nodes, snapshot.edges, preview, invalid,
				));
			updateNodes(snapshot, key, () => previewNodes);
			updateEdges(snapshot, key, previewEdges);
		} catch {
			clearPreview(snapshot);
			snapshot.activeDropTarget = undefined;
			snapshot.lastInsertionPreview = undefined;
			snapshot.previewNodeKey = undefined;
			snapshot.previewEdgeKey = undefined;
		}
	};
