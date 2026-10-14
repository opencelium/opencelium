import { readLiveValueAtPath } from '../components/request-editor/body-editor/requestReferenceOptions';
import type { CollectedReference, CollectedWebhook } from './collectMethodReferences';

export type TestInputSource = 'live' | 'stored' | 'sample' | 'edited' | 'empty';

// `string` sends the text verbatim; `json` parses it and falls back to the text
// when it is not valid JSON. Kept per value so a sample id "123" stays a string.
export type TestInputKind = 'string' | 'json';

export type TestInputValue = { text: string; kind: TestInputKind; source: TestInputSource };

export const referenceInputKey = (reference: CollectedReference) => reference.reference;
export const webhookInputKey = (webhook: CollectedWebhook) => `webhook:${webhook.name}`;

export const EMPTY_INPUT: TestInputValue = { text: '', kind: 'json', source: 'empty' };

export function toInputValue(value: unknown, source: Exclude<TestInputSource, 'empty'>): TestInputValue {
	if (value === undefined) return EMPTY_INPUT;
	if (typeof value === 'string') return { text: value, kind: 'string', source };
	return { text: JSON.stringify(value, null, 2), kind: 'json', source };
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
			return readLiveValueAtPath(parseIfJsonString(sample.body?.fields), parsed.path, () => 0);
		default:
			return undefined;
	}
}

export const defaultWebhookKind = (webhook: CollectedWebhook): TestInputKind =>
	webhook.type === 'string' ? 'string' : 'json';
