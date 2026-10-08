import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { CONNECTOR_SLOT_COUNT } from './minimapPalette';

export type MinimapRect = { x: number; y: number; width: number; height: number };

export type MinimapGroup =
	| { kind: 'connector'; key: string; connectorId: number; label: string; slot: number | 'other' }
	| { kind: 'system'; key: 'system' }
	| { kind: 'trigger'; key: 'trigger' }
	| { kind: 'operator'; key: 'operator' };

export type MinimapShape = 'start' | 'circle' | 'diamond';

export type MinimapDot = {
	id: string;
	x: number;
	y: number;
	shape: MinimapShape;
	/** null only for the start node, which belongs to no legend entry. */
	groupKey: string | null;
};

export type MinimapLine = { id: string; points: [number, number][] };

export type MinimapModel = {
	dots: MinimapDot[];
	lines: MinimapLine[];
	/** Every dot's centre, or null for an empty canvas. */
	bounds: MinimapRect | null;
	groups: MinimapGroup[];
	/** Methods and operators — the start node and comments are not steps. */
	stepCount: number;
	/** Distance between the two closest dots, on whichever axis separates them more — null below two dots. */
	tightestGap: number | null;
};

const isDrawn = (node: WorkflowNodeModel) => node.data.kind !== 'comment' && !node.data.dropPlaceholder;

const centreOf = (node: WorkflowNodeModel): [number, number] => [
	node.position.x + (node.measured?.width ?? node.width ?? 0) / 2,
	node.position.y + (node.measured?.height ?? node.height ?? 0) / 2,
];

const connectorKey = (connectorId: number) => `connector-${connectorId}`;

/**
 * Sorted by id rather than by position, so a connector keeps its colour while the
 * graph is rearranged; a connector past the last slot folds into a shared swatch.
 */
const buildConnectorGroups = (nodes: WorkflowNodeModel[]): MinimapGroup[] => {
	const titles = new Map<number, string>();
	nodes.forEach((node) => {
		const connector = node.data.kind === 'connector' ? node.data.connector : undefined;
		if (connector && !titles.has(connector.connectorId)) titles.set(connector.connectorId, connector.title);
	});
	return [...titles.entries()]
		.sort(([a], [b]) => a - b)
		.map(([connectorId, label], index) => ({
			kind: 'connector', key: connectorKey(connectorId), connectorId, label,
			slot: index < CONNECTOR_SLOT_COUNT ? index : 'other',
		}));
};

const toDot = (node: WorkflowNodeModel): MinimapDot => {
	const [x, y] = centreOf(node);
	switch (node.data.kind) {
		case 'start': return { id: node.id, x, y, shape: 'start', groupKey: null };
		case 'connector': {
			const connectorId = node.data.connector?.connectorId;
			return { id: node.id, x, y, shape: 'circle', groupKey: connectorId == null ? null : connectorKey(connectorId) };
		}
		case 'system': return { id: node.id, x, y, shape: 'circle', groupKey: 'system' };
		case 'trigger-connection': return { id: node.id, x, y, shape: 'circle', groupKey: 'trigger' };
		case 'if':
		case 'loop': return { id: node.id, x, y, shape: 'diamond', groupKey: 'operator' };
		case 'comment': return { id: node.id, x, y, shape: 'circle', groupKey: null };
		default: {
			const _exhaustive: never = node.data.kind;
			return _exhaustive;
		}
	}
};

/** Edges leave a node right or down, so a bend follows the handle the edge left by. */
const toLine = (edge: WorkflowEdgeModel, dotsById: Map<string, MinimapDot>): MinimapLine | null => {
	const source = dotsById.get(edge.source);
	const target = dotsById.get(edge.target);
	if (!source || !target || edge.data?.joint || edge.data?.dropPlaceholder) return null;
	const leavesDownward = edge.sourceHandle === 'bottom' || edge.sourceHandle === 'true';
	const bend: [number, number] = leavesDownward ? [source.x, target.y] : [target.x, source.y];
	return { id: edge.id, points: [[source.x, source.y], bend, [target.x, target.y]] };
};

/** Quadratic, but a workflow has tens of steps, not thousands. */
const tightestGapOf = (dots: MinimapDot[]): number | null => {
	let gap: number | null = null;
	for (let i = 0; i < dots.length; i += 1) {
		for (let j = i + 1; j < dots.length; j += 1) {
			const distance = Math.max(Math.abs(dots[i].x - dots[j].x), Math.abs(dots[i].y - dots[j].y));
			if (distance > 0 && (gap === null || distance < gap)) gap = distance;
		}
	}
	return gap;
};

const boundsOf = (dots: MinimapDot[]): MinimapRect | null => {
	if (dots.length === 0) return null;
	const xs = dots.map((dot) => dot.x);
	const ys = dots.map((dot) => dot.y);
	const x = Math.min(...xs);
	const y = Math.min(...ys);
	return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

export const buildMinimapModel = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]): MinimapModel => {
	const drawn = nodes.filter(isDrawn);
	const dots = drawn.map(toDot);
	const dotsById = new Map(dots.map((dot) => [dot.id, dot]));
	const present = new Set(dots.map((dot) => dot.groupKey));
	const neutralGroups: MinimapGroup[] = [
		{ kind: 'system', key: 'system' },
		{ kind: 'trigger', key: 'trigger' },
		{ kind: 'operator', key: 'operator' },
	];
	return {
		dots,
		lines: edges.flatMap((edge) => toLine(edge, dotsById) ?? []),
		bounds: boundsOf(dots),
		groups: [...buildConnectorGroups(drawn), ...neutralGroups.filter((group) => present.has(group.key))],
		stepCount: drawn.filter((node) => node.data.kind !== 'start').length,
		tightestGap: tightestGapOf(dots),
	};
};
