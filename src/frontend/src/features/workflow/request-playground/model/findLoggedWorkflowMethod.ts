import type { LoggedExecution } from '@features/logs';
import type { WorkflowNodeModel } from '../../types/workflow.types';

type SavedMethod = { color?: string; index?: string | number };
type SavedFlowchart = { methods?: SavedMethod[]; method?: SavedMethod[] };

export function readSavedMethodLocations(connection: unknown) {
	const locations = new Map<string, { indexPath: string; direction: 'source' | 'target' }>();
	if (!connection || typeof connection !== 'object') return locations;
	const { fromConnector, toConnector } = connection as { fromConnector?: SavedFlowchart; toConnector?: SavedFlowchart };
	for (const [direction, flowchart] of [['source', fromConnector], ['target', toConnector]] as const) {
		const methods = flowchart?.methods ?? flowchart?.method;
		if (!Array.isArray(methods)) continue;
		methods.forEach((method, index) => {
			if (typeof method?.color === 'string') {
				locations.set(method.color.toLowerCase(), { indexPath: String(method.index ?? index), direction });
			}
		});
	}
	return locations;
}

export function findLoggedWorkflowMethod(execution: LoggedExecution, nodes: WorkflowNodeModel[], indexById: Map<string, string>) {
	const { direction, indexPath } = execution.location;
	const node = nodes.find(({ id, data }) => {
		if (!indexById.has(id)) return false;
		if (execution.methodLocations) {
			const saved = execution.methodLocations.get(data.color?.toLowerCase() ?? '');
			return saved?.direction === direction && saved.indexPath === indexPath;
		}
		return direction === 'source' && indexById.get(id) === indexPath;
	});
	if (!node || !['connector', 'system', 'trigger-connection'].includes(node.type ?? '')) return null;
	const { properties, segment } = execution.method;
	const config = node.data.methodConfig;
	if (!properties.name || (config?.name ?? node.data.subtitle) !== properties.name) return null;
	if (properties.operationId && properties.operationId.toLowerCase() !== node.data.color?.toLowerCase()) return null;
	const connectorId = properties.connectorId ?? (Number(execution.connectorId) > 0 ? execution.connectorId : undefined);
	if (connectorId != null && Number(connectorId) !== (node.data.connector?.connectorId ?? -1)) return null;
	if (segment?.request?.http_method && (config?.method ?? 'GET') !== segment.request.http_method) return null;
	return node;
}
