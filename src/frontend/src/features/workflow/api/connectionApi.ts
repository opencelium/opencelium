import { apiFetch } from '@shared/api/apiFetch';
import { connectionEndpoints } from './connectionEndpoints';
import { buildFromConnectorPayload } from './connectionPayload';

const withWorkflowFromConnector = (body: unknown) => {
	const payload = body as any;
	if (
		Array.isArray(payload?.fromConnector?.methods) &&
		Array.isArray(payload?.fromConnector?.operators)
	) {
		return body;
	}

	const workflowNodes = payload?.ui?.workflowNodes;
	const workflowEdges = payload?.ui?.workflowEdges;
	if (!Array.isArray(workflowNodes) || !Array.isArray(workflowEdges)) return body;

	return {
		...payload,
		fromConnector: buildFromConnectorPayload(workflowNodes, workflowEdges),
		toConnector: null,
	};
};

export function createConnection(body: unknown) {
	return apiFetch(connectionEndpoints.create, { method: 'POST', body: withWorkflowFromConnector(body) });
}

export function updateConnection(connectionId: string | number, body: unknown) {
	return apiFetch(connectionEndpoints.update(connectionId), { method: 'PUT', body: withWorkflowFromConnector(body) });
}

export function getConnectionById(connectionId: string | number) {
	return apiFetch(connectionEndpoints.getById(connectionId));
}

export function getConnectionVersions(connectionId: string | number) {
	return apiFetch(connectionEndpoints.versions(connectionId));
}

export function getConnectionVersion(connectionId: string | number, snapshotId: string) {
	return apiFetch(connectionEndpoints.version(connectionId, snapshotId));
}

export function updateConnectionVersion(connectionId: string | number, snapshotId: string, body: { comment: string }) {
	return apiFetch(connectionEndpoints.version(connectionId, snapshotId), { method: 'PUT', body });
}

export function deleteConnectionVersion(connectionId: string | number, snapshotId: string) {
	return apiFetch(connectionEndpoints.version(connectionId, snapshotId), { method: 'DELETE' });
}
