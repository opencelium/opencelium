import { readBodyFields } from './collectPlaygroundInputs';
import type { PlaygroundDraft, PlaygroundSentRequest } from './playground.types';

// Mirrors the backend substitution so the URL bar and the cURL preview show the
// request with its test values filled in before anything is sent.
export type Substitution = { pattern: RegExp; whole: RegExp; value: unknown };

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

const buildSubstitution = (source: string, value: unknown): Substitution =>
	({ pattern: new RegExp(source, 'g'), whole: new RegExp(`^${source}$`), value });

export const referenceSubstitution = (reference: string, value: unknown) => buildSubstitution(
	`(?:\\{%\\s*${escapeRegExp(reference)}\\s*%\\}|${escapeRegExp(reference)})`, value);

export const webhookSubstitution = (name: string, value: unknown) =>
	buildSubstitution(`\\$\\{${escapeRegExp(name)}(?::[a-z]+)?\\}`, value);

export const connectionFieldSubstitution = (field: string, value: string) =>
	buildSubstitution(`(?<![$#])\\{${escapeRegExp(field)}\\}`, value);

const substitute = (value: unknown, substitutions: Substitution[]): unknown => {
	if (typeof value === 'string') {
		// A field holding nothing but one reference takes the value's own type.
		const whole = substitutions.find((item) => item.whole.test(value.trim()));
		if (whole) return whole.value;
		return substitutions.reduce((text, item) => text.replace(item.pattern, () => asText(item.value)), value);
	}
	if (Array.isArray(value)) return value.map((item) => substitute(item, substitutions));
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, substitute(nested, substitutions)]));
	}
	return value;
};

export function resolveRequest(draft: PlaygroundDraft, substitutions: Substitution[]): PlaygroundSentRequest {
	const { endpoint, method, header, body } = draft.request;
	return {
		url: asText(substitute(endpoint, substitutions)),
		method,
		headers: substitute(header ?? {}, substitutions) as Record<string, string>,
		body: substitute(readBodyFields(body), substitutions),
	};
}

const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

const hasBody = (body: unknown) => body !== undefined && body !== null && body !== ''
	&& !(typeof body === 'object' && Object.keys(body).length === 0);

export function buildCurl({ url, method, headers, body }: PlaygroundSentRequest): string {
	const lines = [`curl -X ${method.toUpperCase()} ${quote(url)}`,
		...Object.entries(headers ?? {}).map(([key, value]) => `  -H ${quote(`${key}: ${value}`)}`)];
	if (hasBody(body)) lines.push(`  -d ${quote(typeof body === 'string' ? body : JSON.stringify(body))}`);
	return lines.join(' \\\n');
}
