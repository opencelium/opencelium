import { readLiveValueAtPath } from '../components/request-editor/body-editor/requestReferenceOptions';
import type { CollectedReference, CollectedWebhook } from './collectMethodReferences';

export type TestInputSource = 'live' | 'stored' | 'sample' | 'edited' | 'empty';

// `string` sends the text verbatim; `json` parses it and falls back to the text
// when it is not valid JSON. Kept per value so a sample id "123" stays a string.
export type TestInputKind = 'string' | 'json';

export type TestInputValue = { text: string; kind: TestInputKind; source: TestInputSource };

export const referenceInputKey = ({ reference }: Pick<CollectedReference, 'reference'>) => reference;
export const webhookInputKey = ({ name }: Pick<CollectedWebhook, 'name'>) => `webhook:${name}`;

export const EMPTY_INPUT: TestInputValue = { text: '', kind: 'json', source: 'empty' };

export function toInputValue(value: unknown, source: Exclude<TestInputSource, 'empty'>): TestInputValue {
	if (value === undefined) return EMPTY_INPUT;
	if (typeof value === 'string') return { text: value, kind: 'string', source };
	return { text: JSON.stringify(value, null, 2), kind: 'json', source };
}

// A JSON value that does not parse; empty is reported separately as missing.
export function readJsonError({ text, kind }: Pick<TestInputValue, 'text' | 'kind'>): string | null {
	if (kind !== 'json' || !text.trim()) return null;
	try {
		JSON.parse(text);
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

export function parseInputValue({ text, kind }: Pick<TestInputValue, 'text' | 'kind'>): unknown {
	if (kind === 'string' || !text.trim()) return text;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

const parseIfJsonString = (value: unknown) => {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
};

// The connector's documented sample response: the only value available for a
// method that has never run. Iterators read element 0, as the reference picker does.
// An `array` response describes one element in its fields; the sample is that array.
const readSampleBody = (body: { type?: string; fields?: unknown } | null | undefined) => {
	const fields = parseIfJsonString(body?.fields);
	return body?.type === 'array' && !Array.isArray(fields) ? [fields ?? {}] : fields;
};

export function readSampleValue({ parsed, sourceMethod }: CollectedReference): unknown {
	if (!sourceMethod || parsed.direction !== 'response') return undefined;
	const sample = sourceMethod.response?.success;
	if (!sample) return undefined;
	switch (parsed.messageProperty) {
		case 'status':
			return sample.status || undefined;
		case 'header':
			return readLiveValueAtPath(sample.header, parsed.path, () => 0);
		case 'body':
			return readLiveValueAtPath(readSampleBody(sample.body), parsed.path, () => 0);
		default:
			return undefined;
	}
}

export const defaultWebhookKind = (webhook: CollectedWebhook): TestInputKind =>
	webhook.type === 'string' ? 'string' : 'json';
