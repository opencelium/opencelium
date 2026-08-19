import { ALL_COLORS } from '../constants/colors';
import { MethodType } from '../types/connection';
import type { WorkflowNodeModel } from '../types/workflow.types';
import {
	buildPayloadData,
	normalizePayloadColor,
	serializeHeaderReferences,
	serializePayloadData,
	serializeReferenceString,
} from './connectionPayload.references';

const nodeKind = (node: WorkflowNodeModel) => node.type;

const resolveMethodType = (node: WorkflowNodeModel): MethodType => {
	switch (nodeKind(node)) {
		case 'system': return MethodType.HttpRequest;
		case 'trigger-connection': return MethodType.Webhook;
		default: return MethodType.Connector;
	}
};

export const buildMethodPayload = (
	node: WorkflowNodeModel,
	index: string,
	order: number,
	resolvedColor?: string,
	resolvedJump?: string,
) => {
	const config = node.data.methodConfig as any;
	const endpointArgs = config?.endpointArgs ?? {};
	const kind = nodeKind(node);
	const isHttpRequest = kind === 'system' || kind === 'trigger-connection';
	const connectorData = isHttpRequest ? null : node.data.connector;
	const response = config?.response ?? (isHttpRequest
		? {
			responseId: `response-${node.id}`,
			success: { status: '200', header: {}, body: buildPayloadData({}) },
			fail: { status: '500', header: {}, body: buildPayloadData({}) },
		}
		: undefined);

	return {
		id: node.id,
		name: config?.name ?? node.data.subtitle,
		...(node.data.labelEdited ? { label: node.data.subtitle } : {}),
		index,
		methodType: resolveMethodType(node),
		dataAggregator: node.data.dataAggregator ?? null,
		color: normalizePayloadColor(
			resolvedColor ?? (node.data as any).color,
			ALL_COLORS[order % ALL_COLORS.length],
		),
		...(resolvedJump ? { jump: resolvedJump } : {}),
		// Serialized explicitly rather than spread: node.data.connector also carries
		// client-only connector-health fields (status/lastTestError/lastCheckedAt,
		// hydrated from the connector list) and holds the invoker's name under
		// `invokerName`, which is not the property the backend expects — it reads
		// `invoker` (see the normalizer, which accepts a name or an object).
		connector: connectorData
			? {
				connectorId: connectorData.connectorId,
				title: connectorData.title,
				icon: connectorData.icon ?? null,
				invoker: connectorData.invokerName ?? null,
			}
			: null,
		request: {
			endpoint: serializeReferenceString(config?.url ?? '', endpointArgs),
			method: config?.method ?? 'GET',
			header: serializeHeaderReferences(config?.headers ?? {}, endpointArgs),
			body: serializePayloadData(config?.body, endpointArgs, config?.bodyFormat, config?.bodyData),
		},
		...(response ? { response } : {}),
	};
};
