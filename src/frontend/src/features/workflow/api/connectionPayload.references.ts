const REFERENCE_RE =
	/\{%\s*#(?:[A-Fa-f0-9]{6})\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?\s*%}|#(?:[A-Fa-f0-9]{6})\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^;{}\s%]*)?/g;
const ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;

const wrapReference = (value: string) =>
	value.trim().startsWith('{%') ? value : `{%${value}%}`;

export const buildPayloadData = (body: unknown, format = 'json', data = 'raw') => ({
	type: Array.isArray(body) ? 'array' : 'object',
	format,
	data,
	fields: body ?? {},
});

const normalizePayloadData = (body: unknown, format = 'json', data = 'raw') => {
	const isPayload = !!body
		&& typeof body === 'object'
		&& 'type' in body
		&& 'format' in body
		&& 'fields' in body;
	if (!isPayload) return buildPayloadData(body, format, data);
	const payload = body as Record<string, unknown>;
	return { ...payload, data: payload.data ?? data };
};

export const normalizePayloadColor = (color: unknown, fallback: string) => {
	const value = typeof color === 'string' && color.trim() ? color.trim() : fallback;
	return value.startsWith('#') ? value : `#${value}`;
};

export const serializeReferenceString = (
	value: string,
	endpointArgs?: Record<string, any>,
) => value
	.replace(ENDPOINT_ARG_TOKEN_RE, (_, argId: string) => {
		const source = endpointArgs?.[argId]?.source;
		return typeof source === 'string' ? wrapReference(source) : `#{%${argId}%}`;
	})
	.replace(REFERENCE_RE, (reference) => wrapReference(reference));

const serializeHeaderString = (value: string, endpointArgs?: Record<string, any>) => value
	.replace(ENDPOINT_ARG_TOKEN_RE, (token, argId: string) => {
		const source = endpointArgs?.[argId]?.source;
		return typeof source === 'string'
			? source.replace(/^\{%\s*/, '').replace(/\s*%}$/, '')
			: token;
	})
	.replace(
		/\{%\s*(#[A-Fa-f0-9]{6}\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?)\s*%}/g,
		'$1',
	);

export const serializeHeaderReferences = (
	value: unknown,
	endpointArgs?: Record<string, any>,
): unknown => {
	if (typeof value === 'string') return serializeHeaderString(value, endpointArgs);
	if (Array.isArray(value)) {
		return value.map((item) => serializeHeaderReferences(item, endpointArgs));
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value as Record<string, unknown>)
			.map(([key, nested]) => [key, serializeHeaderReferences(nested, endpointArgs)]));
	}
	return value;
};

export const serializePayloadData = (
	body: unknown,
	endpointArgs?: Record<string, any>,
	format = 'json',
	data = 'raw',
) => serializeHeaderReferences(normalizePayloadData(body, format, data), endpointArgs);
