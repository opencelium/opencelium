import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { ConnectionVersionResource, HistoryVersionItem } from '../types/history.types';
import { createConnection, deleteConnectionVersion, getConnectionById, getConnectionVersion, getConnectionVersions, updateConnection, updateConnectionVersion } from './connectionApi';
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
	fieldBindings?: any[];
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
	} catch {}
};

const normalizeVersion = (version: ConnectionVersionResource, fallbackIndex: number): HistoryVersionItem => {
	const snapshotId = version.snapshotId || String(version.connectionId ?? fallbackIndex);
	return {
		id: snapshotId,
		snapshotId,
		createdAt: typeof version.createdAt === 'number' ? version.createdAt : Date.now(),
		author: String(version.author ?? 'Unknown'),
		comment: version.comment ?? '',
		current: Boolean(version.current ?? version.isCurrent),
	};
};

export async function loadConnectionVersions(connectionId: string | number): Promise<HistoryVersionItem[]> {
	const response = await getConnectionVersions(connectionId);
	const versions = Array.isArray(response.data) ? response.data : [];
	return versions
		.map(normalizeVersion)
		.sort((left, right) => right.createdAt - left.createdAt);
}

export async function saveConnectionVersionComment(connectionId: string | number, snapshotId: string, comment: string) {
	await updateConnectionVersion(connectionId, snapshotId, { comment });
}

export async function removeConnectionVersion(connectionId: string | number, snapshotId: string) {
	await deleteConnectionVersion(connectionId, snapshotId);
}

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
	const savedConnectionId = args.connectionId ?? (result.data as any)?.connectionId;
	const snapshotId = (result.data as any)?.nodeId;
	if (savedConnectionId && snapshotId && args.comment !== undefined) {
		await saveConnectionVersionComment(savedConnectionId, snapshotId, args.comment);
	}
	storeCanvas(savedConnectionId, body.ui);
	return result;
}

export async function loadWorkflowConnection(connectionId: string) {
	const response = await getConnectionById(connectionId);
	const versions = await loadConnectionVersions(connectionId);
	const storedUi = readStoredCanvas(connectionId);
	const mergedResponseData = mergeCanvasFallback(response.data, storedUi);
	return {
		...mapConnectionToWorkflowState(mergedResponseData),
		versions,
	};
}

export async function loadWorkflowConnectionVersion(connectionId: string | number, snapshotId: string) {
	const response = await getConnectionVersion(connectionId, snapshotId);
	return mapConnectionToWorkflowState(response.data);
}
