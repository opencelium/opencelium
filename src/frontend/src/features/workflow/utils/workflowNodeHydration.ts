import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { createEmptyMethodConfig } from './requestConfig';

const toWorkflowResponse = (
	nodeId: string,
	response: NonNullable<Connector['invoker']>['operations'][number]['response'],
) => ({
	responseId: `response-${nodeId}`,
	success: response.success,
	fail: response.fail,
});

const normalizeConnectorIcon = (icon: Connector['icon']) =>
	typeof icon === 'string' ? icon : null;

export type HydrateCacheEntry = {
	node: WorkflowNodeModel;
	connectors: Connector[];
	invokers: Invoker[];
	result: WorkflowNodeModel;
};

const hydrateNode = (node: WorkflowNodeModel, connectors: Connector[],
	invokers: Invoker[]): WorkflowNodeModel => {
	if (node.type !== 'connector' && node.type !== 'system') return node;
	const connectorId = node.data.connector?.connectorId;
	const methodName = node.data.subtitle;
	if (!connectorId || !methodName) return node;

	const connector = connectors.find((item) => item.connectorId === connectorId);
	const operation = connector?.invoker?.operations?.find(
		(item) => item.name.toLowerCase() === methodName.toLowerCase(),
	);
	const invokerName = node.data.connector?.invokerName;
	const invokerIcon = !node.data.connector?.icon && invokerName
		? invokers.find((item) =>
			(item.name ?? '').toLowerCase() === invokerName.toLowerCase())?.icon ?? null
		: null;
	if (!connector && !operation?.response && !invokerIcon) return node;

	return { ...node, data: { ...node.data,
		connector: connector ? { ...node.data.connector,
			connectorId: connector.connectorId,
			title: connector.title,
			icon: normalizeConnectorIcon(connector.icon) ??
				normalizeConnectorIcon(connector.invoker?.icon) ?? invokerIcon ??
				node.data.connector?.icon ?? null,
			status: connector.status,
			lastTestError: connector.lastTestError,
			lastCheckedAt: connector.lastCheckedAt,
			invokerName: connector.invoker?.name ?? node.data.connector?.invokerName ?? null,
		} : invokerIcon && node.data.connector
			? { ...node.data.connector, icon: invokerIcon }
			: node.data.connector,
		methodConfig: operation?.response ? { ...createEmptyMethodConfig(),
			...node.data.methodConfig,
			response: toWorkflowResponse(node.id, operation.response),
		} : node.data.methodConfig,
	} };
};

export const hydrateNodesWithOperationResponses = (nodes: WorkflowNodeModel[],
	connectors: Connector[], invokers: Invoker[] = [],
	cache?: Map<string, HydrateCacheEntry>): WorkflowNodeModel[] => {
	if (!connectors.length && !invokers.length) return nodes;
	const result = nodes.map((node) => {
		const cached = cache?.get(node.id);
		if (cached?.node === node && cached.connectors === connectors &&
			cached.invokers === invokers) return cached.result;
		const hydrated = hydrateNode(node, connectors, invokers);
		cache?.set(node.id, { node, connectors, invokers, result: hydrated });
		return hydrated;
	});
	if (cache) {
		const liveIds = new Set(nodes.map((node) => node.id));
		for (const key of cache.keys()) if (!liveIds.has(key)) cache.delete(key);
	}
	return result;
};
