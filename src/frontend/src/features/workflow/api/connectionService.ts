import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { createConnection, getConnectionById, updateConnection } from './connectionApi';
import { mapConnectionToWorkflowState } from './connectionMapper';
import { buildConnectionPayload, buildFromConnectorPayload } from './connectionPayload';

type SaveWorkflowConnectionArgs = {
	connectionId?: string;
	title: string;
	description: string;
	comment?: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	viewport?: { x: number; y: number; zoom: number };
};

const canvasStorageKey = (connectionId: string | number) => `workflow.connection.${connectionId}.canvas`;

const isViewport = (viewport: any) =>
	typeof viewport?.x === 'number' &&
	typeof viewport?.y === 'number' &&
	typeof viewport?.zoom === 'number';

const hasWorkflowNodes = (ui: any) =>
	Array.isArray(ui?.workflowNodes) &&
	ui.workflowNodes.some((node: any) =>
		node?.id &&
		typeof node?.position?.x === 'number' &&
		typeof node?.position?.y === 'number',
	);

const toLayoutNode = (node: any) => ({
	id: node?.id,
	nodeId: node?.nodeId ?? node?.data?.nodeId,
	index: node?.index ?? node?.data?.index,
	color: node?.color ?? node?.data?.color,
	name: node?.name ?? node?.data?.name ?? node?.data?.subtitle,
	type: node?.type,
	position: node?.position,
	draggable: node?.draggable,
	deletable: node?.deletable,
	data: {
		isLeaf: node?.data?.isLeaf,
		rightLeaf: node?.data?.rightLeaf,
		bottomLeaf: node?.data?.bottomLeaf,
		highlighted: node?.data?.highlighted,
		suppressHoverAddControls: node?.data?.suppressHoverAddControls,
		lockVisibleAddControls: node?.data?.lockVisibleAddControls,
	},
});

const toLayoutUi = (ui: any) => ({
	...ui,
	...(Array.isArray(ui?.workflowNodes)
		? { workflowNodes: ui.workflowNodes.map(toLayoutNode) }
		: {}),
});

const readStoredCanvas = (connectionId: string) => {
	try {
		const value = window.localStorage.getItem(canvasStorageKey(connectionId));
		if (!value) return undefined;
		const stored = JSON.parse(value);
		return stored?.source === 'current-save' && stored?.ui
			? stored.ui
			: undefined;
	} catch {
		return undefined;
	}
};

const storeCanvas = (connectionId: string | number | undefined, ui?: any) => {
	if (!connectionId || !ui) return;
	try {
		window.localStorage.setItem(canvasStorageKey(connectionId), JSON.stringify({
			source: 'current-save',
			ui,
		}));
	} catch {
		// Ignore storage failures; backend ui remains the primary source.
	}
};

const mergeCanvasFallback = (responseData: any, storedUi: any) => {
	if (!storedUi) return responseData;

	const responseUi = responseData?.ui ?? {};
	const storedLayoutUi = toLayoutUi(storedUi);
	const mergedUi = {
		...responseUi,
		...(!hasWorkflowNodes(responseUi) && hasWorkflowNodes(storedLayoutUi) ? {
			workflowNodes: storedLayoutUi.workflowNodes,
			flowcharts: storedLayoutUi.flowcharts,
		} : {}),
		...(!Array.isArray(responseUi.workflowEdges) && Array.isArray(storedLayoutUi.workflowEdges) ? {
			workflowEdges: storedLayoutUi.workflowEdges,
			flowchartEdges: storedLayoutUi.flowchartEdges,
		} : {}),
		...(!isViewport(responseUi.viewport) && isViewport(storedLayoutUi.viewport) ? {
			viewport: storedLayoutUi.viewport,
		} : {}),
	};

	return {
		...responseData,
		ui: mergedUi,
	};
};

export async function saveWorkflowConnection(args: SaveWorkflowConnectionArgs) {
	const payload = buildConnectionPayload(args);
	const body = {
		...payload,
		fromConnector: buildFromConnectorPayload(args.nodes, args.edges),
		toConnector: null,
	};
	const response = args.connectionId
		? updateConnection(args.connectionId, body)
		: createConnection(body);
	const result = await response;
	storeCanvas(args.connectionId ?? (result.data as any)?.connectionId, body.ui);
	return result;
}

export async function loadWorkflowConnection(connectionId: string) {
	const response = await getConnectionById(connectionId);
	const storedUi = readStoredCanvas(connectionId);
	const mergedResponseData = mergeCanvasFallback(response.data, storedUi);
	return mapConnectionToWorkflowState(mergedResponseData);
}
