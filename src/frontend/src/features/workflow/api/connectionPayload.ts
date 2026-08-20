import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { sanitizeWorkflowUiNode as sanitizeUiNode } from './connectionPayload.uiSanitizer';
import {
	serializeWorkflowFieldBindings as serializeFieldBindings,
} from './connectionPayload.fieldBindings';
import { buildWorkflowIndexes } from './connectionPayload.indexes';
import { buildFromConnectorPayload } from './connectionPayload.fromConnector';
export { buildWorkflowIndexes } from './connectionPayload.indexes';
export { buildFromConnectorPayload, buildOperatorIndexes } from './connectionPayload.fromConnector';
export { normalizeConnectionPayload } from './connectionPayload.normalizer';

type BuildConnectionPayloadArgs = {
	connectionId?: string | number;
	title: string;
	description: string;
	comment?: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	viewport?: { x: number; y: number; zoom: number };
	fieldBindings?: any[];
	categoryId?: number | null;
};

const buildUiPayload = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	viewport?: { x: number; y: number; zoom: number },
) => {
	const workflowIndexes = buildWorkflowIndexes(nodes, edges);
	// Only an edge leaving an IF carries a branch. Chain edges inside a branch used
	// to inherit the marker (see createNodeFromAction), and on load a stale marker
	// was promoted to a source handle that the method node does not have — which
	// silently cut the chain there (invisible edge, missing indexes, dropped
	// joints). Strip it at the boundary so no saved payload can carry it again.
	const ifNodeIds = new Set(nodes.filter((node) => node.type === 'if').map((node) => node.id));

	return {
		viewport,
		workflowNodes: nodes.map((node) => sanitizeUiNode(node, workflowIndexes.get(node.id))),
		workflowEdges: edges.map((edge) => {
			if (ifNodeIds.has(edge.source) || edge.data?.branch === undefined) return { ...edge };
			const data = { ...edge.data };
			delete data.branch;
			return { ...edge, data };
		}),
		flowcharts: nodes.map((node) => ({
			flowId: node.id,
			x: node.position.x,
			y: node.position.y,
		})),
		flowchartEdges: edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle,
			targetHandle: edge.targetHandle,
		})),
	};
};

export function buildConnectionPayload({
	connectionId,
	title,
	description,
	nodes,
	edges,
	viewport,
	fieldBindings,
	categoryId,
}: BuildConnectionPayloadArgs) {
	const connection = buildLegacyConnection(nodes);
	return {
		...(connectionId ? { connectionId: Number(connectionId) } : {}),
		title,
		name: title,
		description,
		categoryId: categoryId ?? null,
		fieldBinding: serializeFieldBindings(fieldBindings ?? connection.fieldBindings),
		fromConnector: buildFromConnectorPayload(nodes, edges),
		toConnector: null,
		ui: buildUiPayload(nodes, edges, viewport),
	};
}
