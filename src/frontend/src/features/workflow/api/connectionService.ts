import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { createConnection, getConnectionById, getConnectionVersion, updateConnection } from './connectionApi';
import { mapConnectionToWorkflowState } from './connectionMapper';
import { buildConnectionPayload, buildFromConnectorPayload } from './connectionPayload';
import { mergeCanvasFallback, readStoredCanvas, storeCanvas } from './connectionCanvasStorage';
import { loadConnectionVersions, saveConnectionVersionComment } from './connectionVersionService';

export {
	loadConnectionVersions,
	removeConnectionVersion,
	saveConnectionVersionComment,
} from './connectionVersionService';

type SaveWorkflowConnectionArgs = {
	connectionId?: string;
	title: string;
	description: string;
	comment?: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	viewport?: { x: number; y: number; zoom: number };
	fieldBindings?: any[];
	categoryId?: number | null;
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
