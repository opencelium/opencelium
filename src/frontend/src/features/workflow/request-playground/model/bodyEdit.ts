import type { BodyPath } from './bodyPreview';

const setAt = (target: unknown, [head, ...rest]: BodyPath, value: unknown): unknown => {
	if (head === undefined) return value;
	if (Array.isArray(target)) return target.map((item, index) => index === head ? setAt(item, rest, value) : item);
	const record = target && typeof target === 'object' ? target as Record<string, unknown> : {};
	return { ...record, [head]: setAt(record[head], rest, value) };
};

// The body is stored either as its fields or wrapped in a payload that holds them.
export function setBodyValue(body: unknown, path: BodyPath, value: unknown): unknown {
	if (body && typeof body === 'object' && 'fields' in body) {
		return { ...body, fields: setAt((body as { fields: unknown }).fields, path, value) };
	}
	return setAt(body, path, value);
}

// A string stays a string; any other scalar is read back as JSON, falling back to text.
export const toEditText = (raw: unknown) => typeof raw === 'string' ? raw : JSON.stringify(raw);

export function fromEditText(text: string, raw: unknown): unknown {
	if (typeof raw === 'string') return text;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
