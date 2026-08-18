import type { WorkflowNodeData, WorkflowNodeModel } from '../types/workflow.types';

const ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;
const WRAPPED_REFERENCE_RE =
	/(\{%\s*#[A-Fa-f0-9]{6}\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?\s*%})/g;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const wrapReference = (value: string) =>
	value.trim().startsWith('{%') ? value : `{%${value}%}`;

const stripEnhancementObjects = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(stripEnhancementObjects);
	if (isRecord(value)) {
		return Object.fromEntries(Object.entries(value)
			.filter(([key]) => key !== 'enhancement' && key !== 'endpointArgs')
			.map(([key, nested]) => [key, stripEnhancementObjects(nested)]));
	}
	return value;
};

const sanitizeReferences = (value: unknown, endpointArgs?: Record<string, any>): unknown => {
	if (typeof value === 'string') {
		return value.replace(ENDPOINT_ARG_TOKEN_RE, (token, argId: string) => {
			const source = endpointArgs?.[argId]?.source;
			return typeof source === 'string' ? wrapReference(source) : token;
		});
	}
	if (Array.isArray(value)) return value.map((item) => sanitizeReferences(item, endpointArgs));
	if (isRecord(value)) {
		return Object.fromEntries(Object.entries(value)
			.map(([key, nested]) => [key, sanitizeReferences(nested, endpointArgs)]));
	}
	return value;
};

const encodeUrlPart = (value: string) => String(value || '')
	.split(WRAPPED_REFERENCE_RE)
	.map((part) => {
		if (!part) return part;
		if (WRAPPED_REFERENCE_RE.test(part)) {
			WRAPPED_REFERENCE_RE.lastIndex = 0;
			return part;
		}
		WRAPPED_REFERENCE_RE.lastIndex = 0;
		try {
			return encodeURIComponent(decodeURIComponent(part.replace(/\+/g, ' ')));
		} catch {
			return encodeURIComponent(part);
		}
	})
	.join('');

const sanitizeQueryParams = (queryParams: unknown, endpointArgs: Record<string, any>) =>
	Array.isArray(queryParams)
		? queryParams
			.filter((param: any) => param?.enabled && String(param?.key ?? '').trim() !== '')
			.map((param) => {
				const sanitized = stripEnhancementObjects(sanitizeReferences(param, endpointArgs)) as any;
				if (!sanitized || typeof sanitized !== 'object' || sanitized.autoEncode === false) {
					return sanitized;
				}
				return {
					...sanitized,
					key: encodeUrlPart(String(sanitized.key ?? '')),
					value: encodeUrlPart(String(sanitized.value ?? '')),
				};
			})
		: queryParams;

const sanitizeMethodConfig = (methodConfig: unknown) => {
	if (!isRecord(methodConfig)) return methodConfig;
	const { endpointArgs, queryParams, ...rest } = methodConfig;
	const safeEndpointArgs = isRecord(endpointArgs) ? endpointArgs as Record<string, any> : {};
	const sanitizedRest = sanitizeReferences(rest, safeEndpointArgs);
	return stripEnhancementObjects({
		...(isRecord(sanitizedRest) ? sanitizedRest : {}),
		...(queryParams !== undefined
			? { queryParams: sanitizeQueryParams(queryParams, safeEndpointArgs) }
			: {}),
	});
};

const sanitizeNodeData = (data: WorkflowNodeData) => Object.fromEntries(Object.entries({
	title: data.title,
	subtitle: data.subtitle,
	kind: data.kind,
	connector: data.connector,
	methodConfig: sanitizeMethodConfig(data.methodConfig),
	conditionConfig: stripEnhancementObjects(data.conditionConfig),
	dataAggregator: data.dataAggregator,
}).filter(([, value]) => value !== undefined));

export const sanitizeWorkflowUiNode = (node: WorkflowNodeModel, index?: string) => ({
	id: node.id,
	type: node.type,
	position: node.position,
	index,
	data: sanitizeNodeData(node.data as WorkflowNodeData),
	draggable: node.draggable,
	deletable: node.deletable,
});
