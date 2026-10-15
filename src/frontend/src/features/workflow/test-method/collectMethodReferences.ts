import { PAYLOAD_REFERENCE_RE } from '../api/connectionPayload.references';
import { findMethodByColor } from '../components/request-editor/body-editor/requestReferenceOptions';
import { parseEnhancementArg, type ParsedArg } from '../components/request-editor/utils/parseEnhancementArg';
import type { Connection, MethodWithId } from '../types/connection';
import type { TestMethodDraft } from './testMethod.types';

export type MethodReferenceLocation = 'url' | 'header' | 'body';

// Where in this method's request a value lands: the body field path, the header
// name or the query parameter; `null` for a segment of the URL path.
export type MethodReferenceTarget = { location: MethodReferenceLocation; property: string | null };

export type CollectedReference = {
	reference: string;
	parsed: ParsedArg;
	// Undefined when the reference names a color no method on the canvas carries
	// (the source method was deleted) — the user can still supply a value.
	sourceMethod: MethodWithId | undefined;
	targets: MethodReferenceTarget[];
};

export type CollectedWebhook = {
	name: string;
	type: string;
	targets: MethodReferenceTarget[];
};

export type MethodTestInputs = {
	references: CollectedReference[];
	webhooks: CollectedWebhook[];
};

const WEBHOOK_RE = /\$\{([^}:\s]+)(?::([a-z]+))?\}/g;

const unwrapReference = (match: string) => match.trim().replace(/^\{%\s*/, '').replace(/\s*%}$/, '');

const visitStrings = (value: unknown, visit: (text: string, path: string) => void, path = '') => {
	if (typeof value === 'string') return visit(value, path);
	if (Array.isArray(value)) return value.forEach((item, index) => visitStrings(item, visit, `${path}[${index}]`));
	if (value && typeof value === 'object') {
		Object.entries(value as Record<string, unknown>)
			.forEach(([key, nested]) => visitStrings(nested, visit, path ? `${path}.${key}` : key));
	}
};

const addTarget = (targets: MethodReferenceTarget[], target: MethodReferenceTarget) => {
	if (!targets.some((held) => held.location === target.location && held.property === target.property)) {
		targets.push(target);
	}
};

const queryParamAt = (endpoint: string, offset: number) => {
	const queryStart = endpoint.indexOf('?');
	if (queryStart < 0 || offset < queryStart) return null;
	const pair = endpoint.slice(queryStart + 1, offset).split('&').pop() ?? '';
	return pair.split('=')[0] || null;
};

export const readBodyFields = (body: unknown) =>
	body && typeof body === 'object' && 'fields' in body ? (body as { fields: unknown }).fields : body;

export function collectMethodReferences(draft: TestMethodDraft, connection: Connection): MethodTestInputs {
	const references = new Map<string, CollectedReference>();
	const webhooks = new Map<string, CollectedWebhook>();
	const ownColor = draft.color.toLowerCase();

	const scan = (text: string, location: MethodReferenceLocation, property: (offset: number) => string | null) => {
		for (const match of text.matchAll(PAYLOAD_REFERENCE_RE)) {
			const reference = unwrapReference(match[0]);
			const parsed = parseEnhancementArg(reference);
			// The method's own request is what the backend produces while testing,
			// so a self-reference is never an input.
			if (!parsed || (parsed.direction === 'request' && parsed.color.toLowerCase() === ownColor)) continue;
			const target = { location, property: property(match.index) };
			const existing = references.get(reference);
			if (existing) addTarget(existing.targets, target);
			else references.set(reference, {
				reference,
				parsed,
				sourceMethod: findMethodByColor(connection.fromConnector.method, parsed.color),
				targets: [target],
			});
		}
		for (const match of text.matchAll(WEBHOOK_RE)) {
			const [, name, type = 'string'] = match;
			const target = { location, property: property(match.index) };
			const existing = webhooks.get(name);
			if (existing) addTarget(existing.targets, target);
			else webhooks.set(name, { name, type, targets: [target] });
		}
	};

	const { endpoint } = draft.request;
	scan(endpoint, 'url', (offset) => queryParamAt(endpoint, offset));
	visitStrings(draft.request.header, (text, path) => scan(text, 'header', () => path || null));
	visitStrings(readBodyFields(draft.request.body), (text, path) => scan(text, 'body', () => path || null));

	return { references: Array.from(references.values()), webhooks: Array.from(webhooks.values()) };
}
