import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { OFFSETS } from '../utils/graph.constants';
import { getShiftedNodePosition } from './removalGapLayout.utils';
import type { WorkflowPosition } from './workflowPage.types';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	draggedNodes: WorkflowNodeModel[];
	draggedIds: Set<string>;
	draggedRoot?: WorkflowNodeModel;
	makeRoomRoot?: WorkflowNodeModel;
	placeholderPositions: Map<string, WorkflowPosition>;
	removalShifts: Map<string, WorkflowPosition>;
};

export const buildInsertionNodePositions = ({
	nodes,
	edges,
	draggedNodes,
	draggedIds,
	draggedRoot,
	makeRoomRoot,
	placeholderPositions,
	removalShifts,
}: Params) => {
	const positionOf = (node: WorkflowNodeModel) =>
		getShiftedNodePosition(node, removalShifts);
	let shift: WorkflowPosition = { x: 0, y: 0 };
	let makeRoomX = Number.POSITIVE_INFINITY;
	const shiftedIds = new Set<string>();
	if (makeRoomRoot && placeholderPositions.size > 0) {
		const placeholderMaxX = Math.max(...[...placeholderPositions.values()]
			.map((position) => position.x));
		const requiredX = placeholderMaxX + OFFSETS.right.x;
		makeRoomX = positionOf(makeRoomRoot).x;
		shift = { x: Math.max(0, requiredX - makeRoomX), y: 0 };
		if (shift.x !== 0) {
			const ancestors = new Set<string>();
			let frontier = [makeRoomRoot.id];
			while (frontier.length > 0) {
				const next: string[] = [];
				edges.forEach((edge) => {
					if (frontier.includes(edge.target) && !ancestors.has(edge.source)) {
						ancestors.add(edge.source);
						next.push(edge.source);
					}
				});
				frontier = next;
			}
			nodes.forEach((node) => {
				if (draggedIds.has(node.id) || ancestors.has(node.id)) return;
				if (positionOf(node).x >= makeRoomX) shiftedIds.add(node.id);
			});
		}
	}

	const positionsByRealId = new Map<string, WorkflowPosition>();
	nodes.filter((node) => !draggedIds.has(node.id)).forEach((node) => {
		const base = positionOf(node);
		const nodeShift = shiftedIds.has(node.id) ? shift : { x: 0, y: 0 };
		positionsByRealId.set(node.id, {
			x: base.x + nodeShift.x,
			y: base.y + nodeShift.y,
		});
	});
	const dimmedShift = draggedRoot && shift.x !== 0 && draggedRoot.position.x >= makeRoomX
		? shift : { x: 0, y: 0 };
	const sourcePositionByDraggedId = new Map<string, WorkflowPosition>();
	const sourceDimmedPositionByDraggedId = new Map<string, WorkflowPosition>();
	draggedNodes.forEach((node) => {
		const position = {
			x: node.position.x + dimmedShift.x,
			y: node.position.y + dimmedShift.y,
		};
		sourcePositionByDraggedId.set(node.id, position);
		sourceDimmedPositionByDraggedId.set(node.id, position);
	});
	return { positionsByRealId, sourcePositionByDraggedId, sourceDimmedPositionByDraggedId };
};
