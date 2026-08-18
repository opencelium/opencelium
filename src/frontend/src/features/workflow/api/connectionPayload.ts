import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { sanitizeWorkflowUiNode as sanitizeUiNode } from './connectionPayload.uiSanitizer';
import {
	serializeWorkflowFieldBindings as serializeFieldBindings,
} from './connectionPayload.fieldBindings';
import { buildWorkflowIndexes } from './connectionPayload.indexes';
import { buildFromConnectorPayload } from './connectionPayload.fromConnector';
export { buildWorkflowIndexes } from './connectionPayload.indexes';
export { buildFromConnectorPayload } from './connectionPayload.fromConnector';
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
	includeInvoker?: boolean;
};

const buildUiPayload = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	viewport?: { x: number; y: number; zoom: number },
) => {
	const workflowIndexes = buildWorkflowIndexes(nodes, edges);

	return {
		viewport,
		workflowNodes: nodes.map((node) => sanitizeUiNode(node, workflowIndexes.get(node.id))),
		workflowEdges: edges.map((edge) => ({ ...edge })),
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
	includeInvoker,
}: BuildConnectionPayloadArgs) {
	const connection = buildLegacyConnection(nodes);
	return {
		...(connectionId ? { connectionId: Number(connectionId) } : {}),
		title,
		name: title,
		description,
		categoryId: categoryId ?? null,
		fieldBinding: serializeFieldBindings(fieldBindings ?? connection.fieldBindings),
		fromConnector: buildFromConnectorPayload(nodes, edges, { includeInvoker }),
		toConnector: null,
		ui: buildUiPayload(nodes, edges, viewport),
	};
}
