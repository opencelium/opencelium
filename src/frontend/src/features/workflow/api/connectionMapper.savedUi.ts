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

export const getSavedUiEdges = (ui: any): SavedUiEdge[] => {
	const rawEdges = Array.isArray(ui?.workflowEdges)
		? ui.workflowEdges
		: Array.isArray(ui?.flowchartEdges) ? ui.flowchartEdges : [];
	return rawEdges.map((edge: any) => ({
		...edge,
		id: edge?.id
			?? `edge-${edge?.source}-${edge?.target}-${edge?.sourceHandle ?? 'default'}-${edge?.targetHandle ?? 'default'}`,
		source: edge?.source,
		target: edge?.target,
		sourceHandle: edge?.sourceHandle ?? edge?.data?.branch ?? undefined,
		targetHandle: edge?.targetHandle ?? undefined,
		type: 'workflow-edge' as const,
		data: {
			...(edge?.data ?? {}),
			...((edge?.sourceHandle ?? edge?.data?.branch) === 'true'
				? { branch: 'true' as const } : {}),
			...((edge?.sourceHandle ?? edge?.data?.branch) === 'false'
				? { branch: 'false' as const } : {}),
		},
	})).filter((edge: SavedUiEdge) => edge.source && edge.target);
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
