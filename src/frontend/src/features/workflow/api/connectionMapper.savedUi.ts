import type { WorkflowNodeModel } from '../types/workflow.types';
import type { SavedUiEdge, SavedUiNode } from './connectionMapper.types';

const isPosition = (position: any) =>
	typeof position?.x === 'number' && typeof position?.y === 'number';

export const getSavedUiNodes = (ui: any): SavedUiNode[] => {
	if (Array.isArray(ui?.workflowNodes)) {
		return ui.workflowNodes.map((node: any) => ({
			...node,
			id: node?.id,
			nodeId: node?.nodeId ?? node?.data?.nodeId,
			index: node?.index ?? node?.data?.index,
			color: node?.color ?? node?.data?.color,
			name: node?.name ?? node?.data?.name ?? node?.data?.subtitle,
			type: node?.type,
			position: isPosition(node?.position) ? node.position : { x: node?.x, y: node?.y },
			data: node?.data,
			draggable: node?.draggable,
			deletable: node?.deletable,
		})).filter((node: SavedUiNode) => node.id && isPosition(node.position));
	}
	if (Array.isArray(ui?.flowcharts)) {
		return ui.flowcharts.map((node: any) => ({
			id: node?.id ?? node?.flowId,
			position: { x: node?.x, y: node?.y },
		})).filter((node: SavedUiNode) => node.id && isPosition(node.position));
	}
	return [];
};

// Which source handle a saved edge may carry, per source node type. Anything
// else is dropped rather than trusted: an edge whose sourceHandle does not exist
// on its source node is invisible (xyflow cannot resolve the handle) AND breaks
// buildWorkflowIndexes, which matches a chain edge by exactly this handle — so
// every node after it loses its index, taking joints pointing at them down too.
const SOURCE_HANDLES: Partial<Record<NonNullable<SavedUiNode['type']>, string[]>> = {
	if: ['true', 'false'],
	loop: ['bottom', 'right'],
	start: ['bottom'],
	connector: ['bottom'],
	system: ['bottom'],
	'trigger-connection': ['bottom'],
};

type RawSavedEdge = { sourceHandle?: unknown; data?: { branch?: unknown } | null };

const resolveSourceHandle = (edge: RawSavedEdge | undefined, sourceType?: SavedUiNode['type']) => {
	const allowed = sourceType ? SOURCE_HANDLES[sourceType] ?? [] : [];
	if (typeof edge?.sourceHandle === 'string') {
		return allowed.includes(edge.sourceHandle) ? edge.sourceHandle : undefined;
	}
	// Pre-handle payloads stored the branch only in `data.branch`, where it doubles
	// as the IF's handle id. On any other source node type it is a stale marker
	// inherited from the edge this one replaced (see createNodeFromAction) and must
	// not be promoted to a handle.
	const branch = edge?.data?.branch;
	return sourceType === 'if' && (branch === 'true' || branch === 'false')
		? branch as 'true' | 'false' : undefined;
};

const TARGET_HANDLES = ['left', 'top'];

export const getSavedUiEdges = (ui: any, savedNodes: SavedUiNode[] = []): SavedUiEdge[] => {
	const rawEdges = Array.isArray(ui?.workflowEdges)
		? ui.workflowEdges
		: Array.isArray(ui?.flowchartEdges) ? ui.flowchartEdges : [];
	const typeById = new Map(savedNodes.map((node) => [node.id, node.type]));
	return rawEdges.map((edge: any) => {
		const sourceHandle = resolveSourceHandle(edge, typeById.get(edge?.source));
		const restData = { ...(edge?.data ?? {}) };
		delete restData.branch;
		return {
			...edge,
			id: edge?.id
				?? `edge-${edge?.source}-${edge?.target}-${edge?.sourceHandle ?? 'default'}-${edge?.targetHandle ?? 'default'}`,
			source: edge?.source,
			target: edge?.target,
			sourceHandle,
			targetHandle: TARGET_HANDLES.includes(edge?.targetHandle) ? edge.targetHandle : undefined,
			type: 'workflow-edge' as const,
			data: {
				...restData,
				...(sourceHandle === 'true' ? { branch: 'true' as const } : {}),
				...(sourceHandle === 'false' ? { branch: 'false' as const } : {}),
			},
		};
	}).filter((edge: SavedUiEdge) => edge.source && edge.target);
};

export const getInvalidSavedEdgeReason = (
	nodes: WorkflowNodeModel[],
	edges: SavedUiEdge[],
) => {
	if (!edges.length) return 'empty';
	const nodeIds = new Set(nodes.map((node) => node.id));
	const incoming = new Map<string, number>();
	const outgoingHandles = new Set<string>();
	for (const edge of edges) {
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return 'unknown-node';
		const incomingCount = (incoming.get(edge.target) ?? 0) + 1;
		if (incomingCount > 1) return 'duplicate-incoming';
		incoming.set(edge.target, incomingCount);
		const outgoingKey = `${edge.source}:${edge.sourceHandle ?? 'default'}`;
		if (outgoingHandles.has(outgoingKey)) return 'duplicate-outgoing-handle';
		outgoingHandles.add(outgoingKey);
	}
};
