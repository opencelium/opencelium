import { hasReference, parseBody } from './notificationBody';

const INDEX_SEGMENT_RE = /^\d+$/;

/**
 * A body path as the backend binds it: an array index joined to its key (`body[1].text`). The
 * method body editor's form (`body.[1].text`) breaks the backend's path split
 * (PathAndReferenceUtility.splitByDelimiter) as soon as a path has two indexes, which every
 * Teams card value does.
 */
export const toBindingPath = (path: string[]): string => path.reduce((text, segment) => {
	if (INDEX_SEGMENT_RE.test(segment)) return `${text}[${segment}]`;
	return text ? `${text}.${segment}` : segment;
}, '');

/** Reads both forms back to segments: `a[0].b`, `a.[0].b` and `[0].b`. */
export const parseBindingPath = (text: string): string[] => text.split('.').filter(Boolean)
	.flatMap((segment) => {
		const match = /^([^[]*)((?:\[\d+])+)$/.exec(segment);
		if (!match) return [segment];
		const indexes = [...match[2].matchAll(/\[(\d+)]/g)].map((index) => index[1]);
		return match[1] ? [match[1], ...indexes] : indexes;
	});

export type JsonReferenceField = { path: string[]; value: string };

const collectReferenceFields = (value: unknown, path: string[]): JsonReferenceField[] => {
	if (typeof value === 'string') return hasReference(value) ? [{ path, value }] : [];
	const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const)
		: value && typeof value === 'object' ? Object.entries(value) : [];
	return entries.flatMap(([key, nested]) => collectReferenceFields(nested, [...path, key]));
};

/** The text values of hand-edited JSON that hold a reference, or null while the JSON does not parse. */
export const listJsonReferenceFields = (text: string): JsonReferenceField[] | null => {
	const parsed = parseBody(text);
	return parsed.ok ? collectReferenceFields(parsed.value, []) : null;
};

export const readJsonPath = (body: unknown, path: string[]): unknown => path.reduce<unknown>((current, key) =>
	current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, body);

const writePath = (current: unknown, path: string[], value: string): unknown => {
	if (!path.length) return value;
	const [key, ...rest] = path;
	if (Array.isArray(current)) return current.map((item, index) => String(index) === key ? writePath(item, rest, value) : item);
	if (current && typeof current === 'object') {
		const record = current as Record<string, unknown>;
		return { ...record, [key]: writePath(record[key], rest, value) };
	}
	return current;
};

/** The JSON with one text value replaced, or null while it does not parse. Re-indented like the generated body. */
export const writeJsonPath = (text: string, path: string[], value: string): string | null => {
	const parsed = parseBody(text);
	return parsed.ok ? JSON.stringify(writePath(parsed.value, path, value), null, 2) : null;
};
