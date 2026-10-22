import { readLiveValueAtPath } from '../../components/request-editor/body-editor/requestReferenceOptions';
import type { CollectedReference, CollectedWebhook } from './collectPlaygroundInputs';

// `edited` is what the user typed; `empty` a value no source could provide.
export type InputValueSource = 'testRun' | 'lastTest' | 'sample' | 'upstream' | 'edited' | 'empty';

// `string` sends the text verbatim; `json` parses it and falls back to the text
// when it is not valid JSON. Kept per value so a sample id "123" stays a string.
export type InputKind = 'string' | 'json';

export type InputValue = { text: string; kind: InputKind; source: InputValueSource };

export const referenceInputKey = ({ reference }: Pick<CollectedReference, 'reference'>) => reference;
export const webhookInputKey = ({ name }: Pick<CollectedWebhook, 'name'>) => `webhook:${name}`;

export const emptyInput = (kind: InputKind = 'json'): InputValue => ({ text: '', kind, source: 'empty' });

export function toInputValue(value: unknown, source: Exclude<InputValueSource, 'empty'>): InputValue {
	if (value === undefined) return emptyInput();
	if (typeof value === 'string') return { text: value, kind: 'string', source };
	return { text: JSON.stringify(value, null, 2), kind: 'json', source };
}

// A JSON value that does not parse; empty is reported separately as missing.
export function readJsonError({ text, kind }: Pick<InputValue, 'text' | 'kind'>): string | null {
	if (kind !== 'json' || !text.trim()) return null;
	try {
		JSON.parse(text);
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

export function parseInputValue({ text, kind }: Pick<InputValue, 'text' | 'kind'>): unknown {
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

// An `array` response describes one element in its fields; the sample is that array.
const readSampleBody = (body: { type?: string; fields?: unknown } | null | undefined) => {
	const fields = parseIfJsonString(body?.fields);
	return body?.type === 'array' && !Array.isArray(fields) ? [fields ?? {}] : fields;
};

const readSampleSource = ({ parsed, sourceMethod }: CollectedReference): unknown => {
	if (!sourceMethod || parsed.direction !== 'response') return undefined;
	const sample = sourceMethod.response?.success;
	if (!sample) return undefined;
	switch (parsed.messageProperty) {
		case 'status':
			return sample.status || undefined;
		case 'header':
			return sample.header;
		case 'body':
			return readSampleBody(sample.body);
		default:
			return undefined;
	}
};

// The connector's documented sample response: the only value available for a method that
// has never run. Loop iterators read element 0, as the reference picker does.
export function readSampleValue(reference: CollectedReference): unknown {
	const source = readSampleSource(reference);
	if (reference.parsed.messageProperty === 'status') return source;
	return readLiveValueAtPath(source, reference.parsed.path, () => 0);
}

export const defaultWebhookKind = (webhook: CollectedWebhook): InputKind =>
	webhook.type === 'string' ? 'string' : 'json';
