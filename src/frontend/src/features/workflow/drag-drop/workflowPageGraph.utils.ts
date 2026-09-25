import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { OFFSETS } from '../utils/graph.constants';
import type { WorkflowPosition } from './workflowPage.types';

export const DROP_EDGE_MAX_DISTANCE = 90;
export const DROP_LEAF_MAX_DISTANCE = 70;
export const DROP_PLACEHOLDER_PREFIX = '__workflow-drop-placeholder__';
export const COPY_PREVIEW_PREFIX = '__workflow-copy-preview__';

const NODE_BOX_SIZE = 96;
const COLLISION_PADDING = 56;
const COLLISION_MAX_STEPS = 24;
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export const distanceToSegment = (
	point: WorkflowPosition,
	start: WorkflowPosition,
	end: WorkflowPosition,
): number => {
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const lengthSq = dx * dx + dy * dy;
	if (lengthSq === 0) return Math.hypot(point.x - start.x, point.y - start.y);
	const ratio = Math.max(0, Math.min(1,
		((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
	return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
};

export const boundsFromPosition = (position: WorkflowPosition): Bounds => ({
	minX: position.x,
	minY: position.y,
	maxX: position.x + NODE_BOX_SIZE,
	maxY: position.y + NODE_BOX_SIZE,
});

const boundsIntersect = (left: Bounds, right: Bounds, padding = 0) =>
	left.minX - padding < right.maxX && left.maxX + padding > right.minX &&
	left.minY - padding < right.maxY && left.maxY + padding > right.minY;

export const resolvePlaceholderCollision = (
	placeholderBounds: Bounds[],
	occupied: Bounds[],
	direction: 'right' | 'bottom',
): WorkflowPosition => {
	if (placeholderBounds.length === 0 || occupied.length === 0) return { x: 0, y: 0 };
	const step = direction === 'right'
		? { x: OFFSETS.right.x, y: 0 }
		: { x: 0, y: OFFSETS.bottom.y };
	let shift: WorkflowPosition = { x: 0, y: 0 };
	for (let iteration = 0; iteration < COLLISION_MAX_STEPS; iteration += 1) {
		const collides = placeholderBounds.some((box) => {
			const moved = {
				minX: box.minX + shift.x,
				minY: box.minY + shift.y,
				maxX: box.maxX + shift.x,
				maxY: box.maxY + shift.y,
			};
			return occupied.some((other) => boundsIntersect(moved, other, COLLISION_PADDING));
		});
		if (!collides) break;
		shift = { x: shift.x + step.x, y: shift.y + step.y };
	}
	return shift;
};

const isFinitePosition = (position?: WorkflowPosition) =>
	!!position && Number.isFinite(position.x) && Number.isFinite(position.y);

export const sanitizeGraphNodes = (nodes: WorkflowNodeModel[]): WorkflowNodeModel[] => {
	const seen = new Set<string>();
	return nodes.reduce<WorkflowNodeModel[]>((result, node) => {
		if (!node || typeof node.id !== 'string' || seen.has(node.id)) return result;
		seen.add(node.id);
		result.push(isFinitePosition(node.position) ? node : {
			...node,
			position: {
				x: Number.isFinite(node.position?.x) ? node.position.x : 0,
				y: Number.isFinite(node.position?.y) ? node.position.y : 0,
			},
		});
		return result;
	}, []);
};

export const sanitizeGraphEdges = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): WorkflowEdgeModel[] => {
	const nodeIds = new Set(nodes.map((node) => node.id));
	const seen = new Set<string>();
	return edges.filter((edge) => {
		if (!edge || typeof edge.id !== 'string' || seen.has(edge.id)) return false;
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
		seen.add(edge.id);
		return true;
	});
};
