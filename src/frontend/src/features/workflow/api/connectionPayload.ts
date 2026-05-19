import type { WorkflowEdgeModel, WorkflowNodeData, WorkflowNodeModel } from '../types/workflow.types';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { ALL_COLORS } from '../constants/colors';

type BuildConnectionPayloadArgs = {
	connectionId?: string | number;
	title: string;
	description: string;
	comment?: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	viewport?: { x: number; y: number; zoom: number };
};

const normalizeIndex = (value: unknown, fallback: number) =>
	typeof value === 'string' ? value : String(value ?? fallback);

const parseIndexPath = (value: unknown) =>
	String(value ?? '')
		.split('_')
		.map((part) => Number(part))
		.map((part) => (Number.isFinite(part) ? part : 0));

const compareIndex = (left: { index?: unknown }, right: { index?: unknown }) => {
	const leftPath = parseIndexPath(left.index);
	const rightPath = parseIndexPath(right.index);
	const length = Math.max(leftPath.length, rightPath.length);

	for (let index = 0; index < length; index += 1) {
		const leftPart = leftPath[index] ?? -1;
		const rightPart = rightPath[index] ?? -1;

		if (leftPart !== rightPart) return leftPart - rightPart;
	}

	return leftPath.length - rightPath.length;
};

const operatorBottomHandle = (node: WorkflowNodeModel) => {
	if (node.type === 'if') return 'true';
	if (node.type === 'loop') return 'bottom';
	return undefined;
};

const nodeRightHandle = (node: WorkflowNodeModel) => {
	if (node.type === 'if') return 'false';
	if (node.type === 'loop') return 'right';
	return undefined;
};

const nodeKind = (node: WorkflowNodeModel) => {
	const data = node.data as WorkflowNodeData;
	return node.type || data.kind;
};

const isMethodNode = (node: WorkflowNodeModel) => {
	const kind = nodeKind(node);
	return kind === 'connector';
};

const isOperatorNode = (node: WorkflowNodeModel) => {
	const kind = nodeKind(node);
	return kind === 'if' || kind === 'loop';
};

const getTargetHandleForDirection = (direction: 'right' | 'bottom') =>
	direction === 'bottom' ? 'top' : 'left';

const findOutgoingEdge = (
	edges: WorkflowEdgeModel[],
	nodes: Map<string, WorkflowNodeModel>,
	nodeId: string,
	sourceHandle: string | undefined,
	direction: 'right' | 'bottom',
	visited: Set<string>,
) => {
	const sourceNode = nodes.get(nodeId);
	const targetHandle = getTargetHandleForDirection(direction);
	const candidates = edges
		.filter((edge) => edge.source === nodeId && (edge.sourceHandle ?? undefined) === sourceHandle)
		.filter((edge) => !visited.has(edge.target))
		.filter((edge) => !edge.targetHandle || edge.targetHandle === targetHandle)
		.filter((edge) => nodes.has(edge.target));

	return candidates.sort((left, right) => {
		const leftNode = nodes.get(left.target);
		const rightNode = nodes.get(right.target);
		if (!sourceNode || !leftNode || !rightNode) return 0;

		const leftPrimaryDistance = direction === 'right'
			? Math.abs(leftNode.position.y - sourceNode.position.y)
			: Math.abs(leftNode.position.x - sourceNode.position.x);
		const rightPrimaryDistance = direction === 'right'
			? Math.abs(rightNode.position.y - sourceNode.position.y)
			: Math.abs(rightNode.position.x - sourceNode.position.x);

		if (leftPrimaryDistance !== rightPrimaryDistance) {
			return leftPrimaryDistance - rightPrimaryDistance;
		}

		return direction === 'right'
			? leftNode.position.x - rightNode.position.x
			: leftNode.position.y - rightNode.position.y;
	})[0];
};

const buildUiPayload = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	viewport?: { x: number; y: number; zoom: number },
) => ({
	viewport,
	workflowNodes: nodes.map((node) => sanitizeUiNode(node)),
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
});

const UI_ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const stripEnhancementObjects = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(stripEnhancementObjects);
	if (isRecord(value)) {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key]) => key !== 'enhancement' && key !== 'endpointArgs')
				.map(([key, nested]) => [key, stripEnhancementObjects(nested)]),
		);
	}
	return value;
};

const sanitizeUiReferenceString = (value: string, endpointArgs?: Record<string, any>) =>
	value.replace(UI_ENDPOINT_ARG_TOKEN_RE, (token, argId: string) => {
		const source = endpointArgs?.[argId]?.source;
		return typeof source === 'string' ? wrapReference(source) : token;
	});

const sanitizeUiReferences = (value: unknown, endpointArgs?: Record<string, any>): unknown => {
	if (typeof value === 'string') return sanitizeUiReferenceString(value, endpointArgs);
	if (Array.isArray(value)) return value.map((item) => sanitizeUiReferences(item, endpointArgs));
	if (isRecord(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, nested]) => [
				key,
				sanitizeUiReferences(nested, endpointArgs),
			]),
		);
	}
	return value;
};

const sanitizeQueryParams = (queryParams: unknown, endpointArgs?: Record<string, any>) =>
	Array.isArray(queryParams)
		? queryParams
			.filter((param: any) => param?.enabled && String(param?.key ?? '').trim() !== '')
			.map((param) => stripEnhancementObjects(sanitizeUiReferences(param, endpointArgs)))
		: queryParams;

const sanitizeMethodConfig = (methodConfig: unknown) => {
	if (!isRecord(methodConfig)) return methodConfig;
	const { endpointArgs, queryParams, ...rest } = methodConfig;
	const safeEndpointArgs = isRecord(endpointArgs)
		? endpointArgs as Record<string, any>
		: {};
	const sanitizedRest = sanitizeUiReferences(rest, safeEndpointArgs);

	return stripEnhancementObjects({
		...(isRecord(sanitizedRest) ? sanitizedRest : {}),
		...(queryParams !== undefined ? { queryParams: sanitizeQueryParams(queryParams, safeEndpointArgs) } : {}),
	});
};

const sanitizeNodeData = (data: WorkflowNodeData) => {
	const safeData = {
		title: data.title,
		subtitle: data.subtitle,
		kind: data.kind,
		connector: data.connector,
		methodConfig: sanitizeMethodConfig(data.methodConfig),
		conditionConfig: stripEnhancementObjects(data.conditionConfig),
	};

	return Object.fromEntries(
		Object.entries(safeData).filter(([, value]) => value !== undefined),
	);
};

const sanitizeUiNode = (node: WorkflowNodeModel) => ({
	id: node.id,
	type: node.type,
	position: node.position,
	data: sanitizeNodeData(node.data as WorkflowNodeData),
	draggable: node.draggable,
	deletable: node.deletable,
});

const buildWorkflowIndexes = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const indexes = new Map<string, string>();
	const visited = new Set<string>();

	const walkChain = (
		sourceId: string,
		sourceHandle: string | undefined,
		direction: 'right' | 'bottom',
		prefix?: string,
	) => {
		let edge = findOutgoingEdge(edges, nodeById, sourceId, sourceHandle, direction, visited);
		let order = 0;

		while (edge) {
			const node = nodeById.get(edge.target);
			if (!node || visited.has(node.id)) break;

			const nodeIndex = prefix ? `${prefix}_${order}` : String(order);
			indexes.set(node.id, nodeIndex);
			visited.add(node.id);

			const bottomHandle = operatorBottomHandle(node);
			if (bottomHandle) {
				walkChain(node.id, bottomHandle, 'bottom', nodeIndex);
			}

			edge = findOutgoingEdge(edges, nodeById, node.id, nodeRightHandle(node), 'right', visited);
			order += 1;
		}
	};

	walkChain('start-1', undefined, 'right');

	return indexes;
};

const stripPluralConnectorLists = (connector: any) => {
	if (!connector) return connector;
	const { methods, operators, ...rest } = connector;
	return rest;
};

const buildPayloadData = (body: unknown, format = 'json') => ({
	type: Array.isArray(body) ? 'array' : 'object',
	format,
	data: 'raw',
	fields: body ?? {},
});

const isPayloadData = (body: unknown) =>
	!!body &&
	typeof body === 'object' &&
	'type' in body &&
	'format' in body &&
	'fields' in body;

const normalizePayloadData = (body: unknown, format = 'json') => {
	if (!isPayloadData(body)) return buildPayloadData(body, format);
	const payload = body as Record<string, unknown>;
	return {
		...payload,
		data: payload.data ?? 'raw',
	};
};

const normalizeColor = (color: unknown, fallback: string) => {
	const value = typeof color === 'string' && color.trim() ? color.trim() : fallback;
	return value.startsWith('#') ? value : `#${value}`;
};

const REFERENCE_RE =
	/\{%\s*#(?:[A-Fa-f0-9]{6})\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?\s*%}|#(?:[A-Fa-f0-9]{6})\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^;{}\s%]*)?/g;

const ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;

const wrapReference = (value: string) =>
	value.trim().startsWith('{%') ? value : `{%${value}%}`;

const serializeReferenceString = (value: string, endpointArgs?: Record<string, any>) =>
	value
		.replace(ENDPOINT_ARG_TOKEN_RE, (_, argId: string) => {
			const source = endpointArgs?.[argId]?.source;
			return typeof source === 'string' ? wrapReference(source) : `#{%${argId}%}`;
		})
		.replace(REFERENCE_RE, (reference) => wrapReference(reference));

const serializeReferences = (value: unknown, endpointArgs?: Record<string, any>): unknown => {
	if (typeof value === 'string') return serializeReferenceString(value, endpointArgs);
	if (Array.isArray(value)) return value.map((item) => serializeReferences(item, endpointArgs));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
				key,
				serializeReferences(nested, endpointArgs),
			]),
		);
	}
	return value;
};

const serializeHeaderReferenceString = (value: string, endpointArgs?: Record<string, any>) =>
	value
		.replace(ENDPOINT_ARG_TOKEN_RE, (token, argId: string) => {
			const source = endpointArgs?.[argId]?.source;
			return typeof source === 'string'
				? source.replace(/^\{%\s*/, '').replace(/\s*%}$/, '')
				: token;
		})
		.replace(/\{%\s*(#[A-Fa-f0-9]{6}\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?)\s*%}/g, '$1');

const serializeHeaderReferences = (value: unknown, endpointArgs?: Record<string, any>): unknown => {
	if (typeof value === 'string') return serializeHeaderReferenceString(value, endpointArgs);
	if (Array.isArray(value)) return value.map((item) => serializeHeaderReferences(item, endpointArgs));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
				key,
				serializeHeaderReferences(nested, endpointArgs),
			]),
		);
	}
	return value;
};

const serializePayloadData = (body: unknown, endpointArgs?: Record<string, any>, format = 'json') =>
	serializeHeaderReferences(normalizePayloadData(body, format), endpointArgs);

const serializeMethodResponse = (
	response: any,
	fallbackBody: unknown,
	endpointArgs: Record<string, any>,
	format = 'json',
) => ({
	...response,
	body: serializePayloadData(response?.body ?? fallbackBody, endpointArgs, format),
});

const buildMethodPayload = (node: WorkflowNodeModel, index: string, order: number) => {
	const config = node.data.methodConfig as any;
	const endpointArgs = config?.endpointArgs ?? {};

	return {
		id: node.id,
		name: node.data.subtitle,
		index,
		color: normalizeColor((node.data as any).color, ALL_COLORS[order % ALL_COLORS.length]),
		connector: node.data.connector,
		request: {
			endpoint: serializeReferenceString(config?.url ?? '', endpointArgs),
			method: config?.method ?? 'GET',
			header: serializeHeaderReferences(config?.headers ?? {}, endpointArgs),
			body: serializePayloadData(config?.body, endpointArgs, config?.bodyFormat),
		},
		...(config?.response ? { response: config.response } : {}),
	};
};

const buildOperatorPayload = (node: WorkflowNodeModel, index: string) => ({
	id: node.id,
	index,
	type: nodeKind(node),
	expression: node.data.conditionConfig?.expression ?? '',
	...(nodeKind(node) === 'loop' && (node.data.conditionConfig as any)?.iterator
		? { iterator: (node.data.conditionConfig as any).iterator }
		: {}),
});

const parseBindingReference = (reference: unknown) => {
	const match = String(reference ?? '')
		.trim()
		.replace(/^\{%\s*/, '')
		.replace(/\s*%}$/, '')
		.match(/^(#[A-Fa-f0-9]{6})\.\((request|response)\)\.(.+)$/);
	if (!match) return undefined;
	return {
		color: match[1],
		type: match[2],
		field: match[3],
	};
};

const serializeFieldBinding = (binding: any) => {
	const args = binding?.enhancement?.args;
	if (!args?.RESULT_VAR) return binding;

	const to = parseBindingReference(args.RESULT_VAR);
	const from = Object.keys(args)
		.filter((key) => /^VAR_\d+$/.test(key))
		.sort((left, right) => Number(left.slice(4)) - Number(right.slice(4)))
		.map((key) => parseBindingReference(args[key]))
		.filter(Boolean);

	if (!to || from.length === 0) return binding;

	const expertVar = [
		`//var RESULT_VAR = ${args.RESULT_VAR};`,
		...from.map((item: any, index) => `//var VAR_${index} = ${item.color}.(${item.type}).${item.field};`),
	].join('\n');

	return {
		...(binding?.id ? { id: binding.id } : {}),
		from,
		to: [to],
		enhancement: {
			...(Number.isInteger(Number(binding?.enhancement?.enhanceId))
				? { enhancementId: Number(binding.enhancement.enhanceId) }
				: {}),
			name: binding?.enhancement?.name ?? '',
			description: binding?.enhancement?.description ?? '',
			language: binding?.enhancement?.language ?? 'js',
			simpleCode: binding?.enhancement?.simpleCode ?? null,
			expertVar,
			expertCode: binding?.enhancement?.script?.endsWith(';')
				? binding.enhancement.script
				: `${binding?.enhancement?.script ?? 'RESULT_VAR = VAR_0'};`,
		},
	};
};

const serializeFieldBindings = (fieldBindings: any) =>
	Array.isArray(fieldBindings) ? fieldBindings.map(serializeFieldBinding) : fieldBindings;

export function buildFromConnectorPayload(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) {
	const workflowIndexes = buildWorkflowIndexes(nodes, edges);
	const methods = nodes
		.filter(isMethodNode)
		.map((node, index) => buildMethodPayload(node, normalizeIndex(workflowIndexes.get(node.id), index), index))
		.sort(compareIndex);
	const operators = nodes
		.filter(isOperatorNode)
		.map((node, index) => buildOperatorPayload(node, workflowIndexes.get(node.id) ?? String(methods.length + index)))
		.sort(compareIndex);

	const fromConnector = {
		connectorId: -1,
		title: 'DEFAULT',
		methods,
		operators,
	};

	return fromConnector;
}

export function buildConnectionPayload({
	connectionId,
	title,
	description,
	nodes,
	edges,
	viewport,
}: BuildConnectionPayloadArgs) {
	const connection = buildLegacyConnection(nodes);
	return {
		...(connectionId ? { connectionId: Number(connectionId) } : {}),
		title,
		name: title,
		description,
		fieldBinding: serializeFieldBindings(connection.fieldBindings),
		fromConnector: buildFromConnectorPayload(nodes, edges),
		toConnector: null,
		ui: buildUiPayload(nodes, edges, viewport),
	};
}

export function normalizeConnectionPayload(payload: any) {
	const fromConnector = stripPluralConnectorLists(payload?.fromConnector);
	const sourceFromConnector = fromConnector;
	const sourceMethods = Array.isArray(payload?.fromConnector?.methods)
		? payload.fromConnector.methods
		: Array.isArray(sourceFromConnector?.method)
			? sourceFromConnector.method
			: [];
	const sourceOperators = Array.isArray(payload?.fromConnector?.operators)
		? payload.fromConnector.operators
		: Array.isArray(sourceFromConnector?.operator)
			? sourceFromConnector.operator
			: [];

	return {
		...payload,
		title: payload?.title ?? payload?.name ?? 'Workflow Connection',
		name: payload?.name ?? payload?.title ?? 'Workflow Connection',
		fromConnector: {
			...sourceFromConnector,
			connectorId: -1,
			title: 'DEFAULT',
			method: sourceMethods.map((method: any, index: number) => ({
				...method,
				index: normalizeIndex(method?.index, index),
				connector: {
					connectorId: method?.connector?.connectorId ?? method?.connectorId ?? -1,
					title: method?.connector?.title ?? method?.connectorTitle ?? method?.connector?.name ?? 'DEFAULT',
					icon: method?.connector?.icon ?? null,
				},
			})),
			operator: sourceOperators.map((operator: any, index: number) => ({
				...operator,
				index: normalizeIndex(operator?.index, index),
			})),
		},
		toConnector: null,
	};
}
