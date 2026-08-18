import type { WorkflowNodeModel } from '../types/workflow.types';
import { collectReferenceColors } from './graph.referenceColors';

const ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;

const removeColors = (value: unknown, colors: Set<string>): unknown => {
	if (typeof value === 'string') return value.split(';')
		.map((part) => part.trim())
		.filter((part) => {
			const references = collectReferenceColors(part);
			return references.size === 0 ||
				![...references].some((color) => colors.has(color));
		})
		.join(';');
	if (Array.isArray(value)) return value.map((item) => removeColors(item, colors));
	if (value && typeof value === 'object') return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([key, nested]) =>
			[key, removeColors(nested, colors)]),
	);
	return value;
};

const endpointArgIdsForColors = (methodConfig: unknown, colors: Set<string>) => {
	if (!methodConfig || typeof methodConfig !== 'object') return new Set<string>();
	const endpointArgs = (methodConfig as Record<string, any>).endpointArgs;
	if (!endpointArgs || typeof endpointArgs !== 'object') return new Set<string>();
	return new Set(Object.entries(endpointArgs)
		.filter(([, argument]: [string, any]) =>
			[...collectReferenceColors(argument?.source)].some((color) => colors.has(color)))
		.map(([id]) => id));
};

const removeEndpointArgTokens = (value: string, argumentIds: Set<string>) =>
	value.replace(ENDPOINT_ARG_TOKEN_RE,
		(token, argumentId: string) => argumentIds.has(argumentId) ? '' : token);

const removeEndpointArgReferences = (methodConfig: unknown, colors: Set<string>) => {
	const argumentIds = endpointArgIdsForColors(methodConfig, colors);
	if (!methodConfig || typeof methodConfig !== 'object') return methodConfig;
	const config = methodConfig as Record<string, any>;
	const cleaned = removeColors(config, colors) as Record<string, any>;
	if (!argumentIds.size) return cleaned;
	return { ...cleaned,
		url: typeof config.url === 'string'
			? removeEndpointArgTokens(config.url, argumentIds) : config.url,
		queryParams: Array.isArray(config.queryParams) ? config.queryParams.map((param: any) => ({
			...param,
			key: typeof param?.key === 'string'
				? removeEndpointArgTokens(param.key, argumentIds) : param?.key,
			value: typeof param?.value === 'string'
				? removeEndpointArgTokens(param.value, argumentIds) : param?.value,
		})) : config.queryParams,
		endpointArgs: Object.fromEntries(Object.entries(cleaned.endpointArgs ?? {})
			.filter(([id]) => !argumentIds.has(id))),
	};
};

export const removeNodeDataReferenceColors = (
	data: WorkflowNodeModel['data'],
	colors: Set<string>,
): WorkflowNodeModel['data'] => {
	const { methodConfig, ...restData } = data;
	const cleaned = removeColors(restData, colors) as
		Omit<WorkflowNodeModel['data'], 'methodConfig'>;
	return methodConfig ? { ...cleaned,
		methodConfig: removeEndpointArgReferences(methodConfig, colors) as
			WorkflowNodeModel['data']['methodConfig'],
	} : cleaned as WorkflowNodeModel['data'];
};
