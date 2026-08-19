import type { EndpointArg } from '../../../types/connection';

const BACKEND_REFERENCE_RE =
	/\{%\s*(#[A-Fa-f0-9]{6}\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?)\s*%}/g;

const referenceTokenId = (source: string) => {
	let hash = 0;
	for (let index = 0; index < source.length; index += 1) {
		hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
	}
	return `ref_${hash.toString(16)}`;
};

export function deserializeBackendReferenceTokens(
	raw: string,
	endpointArgs: Record<string, EndpointArg> = {},
) {
	const nextArgs = { ...endpointArgs };
	const sourceToId = new Map<string, string>();
	Object.values(nextArgs).forEach((arg) => {
		if (arg?.source) sourceToId.set(arg.source, arg.id);
	});
	const value = String(raw || '').replace(BACKEND_REFERENCE_RE, (_match, source: string) => {
		const id = sourceToId.get(source) || referenceTokenId(source);
		sourceToId.set(source, id);
		nextArgs[id] = { ...nextArgs[id], id, source };
		return `#{%${id}%}`;
	});
	return { value, endpointArgs: nextArgs };
}

export function unwrapBackendReferences(value: unknown): unknown {
	if (typeof value === 'string') {
		return value.replace(BACKEND_REFERENCE_RE, (_match, source: string) => source);
	}
	if (Array.isArray(value)) return value.map(unwrapBackendReferences);
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value as Record<string, unknown>)
			.map(([key, nested]) => [key, unwrapBackendReferences(nested)]));
	}
	return value;
}
