import { useMemo } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildFromConnectorPayload } from '../api/connectionPayload';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	sidebarNodeId?: string;
	contextMenuNodeId?: string;
	editorNodeId?: string;
	conditionNodeId?: string;
	aggregatorNodeId?: string;
};

export const useWorkflowDerivedData = ({ nodes, edges, fieldBindings,
	sidebarNodeId, contextMenuNodeId, editorNodeId, conditionNodeId,
	aggregatorNodeId }: Params) => {
	const findNode = (nodeId?: string) =>
		nodes.find((node) => node.id === nodeId) ?? null;
	const conditionConnection = useMemo(() => {
		const legacyConnection = buildLegacyConnection(nodes);
		const fromConnector = buildFromConnectorPayload(nodes, edges) as any;
		return { ...legacyConnection,
			fieldBindings: fieldBindings ?? legacyConnection.fieldBindings,
			fromConnector: {
				connectorId: fromConnector.connectorId,
				title: fromConnector.title,
				method: fromConnector.methods ?? fromConnector.method ?? [],
				operator: fromConnector.operators ?? fromConnector.operator ?? [],
			},
		};
	}, [nodes, edges, fieldBindings]);

	return {
		selectedNode: findNode(sidebarNodeId),
		contextMenuNode: findNode(contextMenuNodeId),
		editorNode: findNode(editorNodeId),
		conditionNode: findNode(conditionNodeId),
		aggregatorNode: findNode(aggregatorNodeId),
		conditionConnection,
	};
};
