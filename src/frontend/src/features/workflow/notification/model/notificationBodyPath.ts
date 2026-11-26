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

/** A text value of the JSON with where its token (quotes included) stands in the text. */
export type JsonReferenceField = { path: string[]; value: string; start: number; end: number };

const isSpace = (char: string) => char === ' ' || char === '\n' || char === '\r' || char === '\t';

/**
 * Walks JSON that is already known to parse and records every string value (not key) with its
 * path and offsets, so a value can be found on its line and replaced without re-formatting.
 */
const locateStrings = (text: string): JsonReferenceField[] => {
	const found: JsonReferenceField[] = [];
	let index = 0;
	const skipSpace = () => { while (index < text.length && isSpace(text[index])) index += 1; };
	const readString = () => {
		const start = index;
		index += 1;
		while (text[index] !== '"') index += text[index] === '\\' ? 2 : 1;
		index += 1;
		return { start, end: index, value: JSON.parse(text.slice(start, index)) as string };
	};
	const readValue = (path: string[]): void => {
		skipSpace();
		const char = text[index];
		if (char === '"') {
			found.push({ path, ...readString() });
		} else if (char === '{') {
			index += 1;
			skipSpace();
			while (text[index] !== '}') {
				if (text[index] === ',') {
					index += 1;
					skipSpace();
				}
				const key = readString().value;
				skipSpace();
				index += 1; // the colon
				readValue([...path, key]);
				skipSpace();
			}
			index += 1;
		} else if (char === '[') {
			index += 1;
			skipSpace();
			for (let position = 0; text[index] !== ']'; position += 1) {
				if (text[index] === ',') index += 1;
				readValue([...path, String(position)]);
				skipSpace();
			}
			index += 1;
		} else {
			while (index < text.length && !/[\s,\]}]/.test(text[index])) index += 1;
		}
	};
	readValue([]);
	return found;
};

/** Every text value of hand-edited JSON, or null while the JSON does not parse. */
export const listJsonStringFields = (text: string): JsonReferenceField[] | null =>
	parseBody(text).ok ? locateStrings(text) : null;

/** The text values of hand-edited JSON that hold a reference, or null while the JSON does not parse. */
export const listJsonReferenceFields = (text: string): JsonReferenceField[] | null =>
	listJsonStringFields(text)?.filter((field) => hasReference(field.value)) ?? null;

/** The JSON with one located value replaced in place; the rest keeps its formatting. */
export const replaceJsonValue = (text: string, field: Pick<JsonReferenceField, 'start' | 'end'>, value: string) =>
	`${text.slice(0, field.start)}${JSON.stringify(value)}${text.slice(field.end)}`;

export const readJsonPath = (body: unknown, path: string[]): unknown => path.reduce<unknown>((current, key) =>
	current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, body);
