import type { WorkflowNodeModel } from '../types/workflow.types';
import type { ReferenceMatcher } from './graph.referenceColors';

const ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;

const removeMatching = (value: unknown, matches: ReferenceMatcher): unknown => {
	if (typeof value === 'string') return value.split(';')
		.map((part) => part.trim())
		.filter((part) => !matches(part))
		.join(';');
	if (Array.isArray(value)) return value.map((item) => removeMatching(item, matches));
	if (value && typeof value === 'object') return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([key, nested]) =>
			[key, removeMatching(nested, matches)]),
	);
	return value;
};

const endpointArgIdsMatching = (methodConfig: unknown, matches: ReferenceMatcher) => {
	if (!methodConfig || typeof methodConfig !== 'object') return new Set<string>();
	const endpointArgs = (methodConfig as Record<string, any>).endpointArgs;
	if (!endpointArgs || typeof endpointArgs !== 'object') return new Set<string>();
	return new Set(Object.entries(endpointArgs)
		.filter(([, argument]: [string, any]) => matches(argument?.source))
		.map(([id]) => id));
};

const removeEndpointArgTokens = (value: string, argumentIds: Set<string>) =>
	value.replace(ENDPOINT_ARG_TOKEN_RE,
		(token, argumentId: string) => argumentIds.has(argumentId) ? '' : token);

const removeEndpointArgReferences = (methodConfig: unknown, matches: ReferenceMatcher) => {
	const argumentIds = endpointArgIdsMatching(methodConfig, matches);
	if (!methodConfig || typeof methodConfig !== 'object') return methodConfig;
	const config = methodConfig as Record<string, any>;
	const cleaned = removeMatching(config, matches) as Record<string, any>;
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

export const removeNodeDataReferences = (
	data: WorkflowNodeModel['data'],
	matches: ReferenceMatcher,
): WorkflowNodeModel['data'] => {
	const { methodConfig, ...restData } = data;
	const cleaned = removeMatching(restData, matches) as
		Omit<WorkflowNodeModel['data'], 'methodConfig'>;
	return methodConfig ? { ...cleaned,
		methodConfig: removeEndpointArgReferences(methodConfig, matches) as
			WorkflowNodeModel['data']['methodConfig'],
	} : cleaned as WorkflowNodeModel['data'];
};
