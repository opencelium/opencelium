import { PAYLOAD_REFERENCE_RE } from '../api/connectionPayload.references';
import { findMethodByColor } from '../components/request-editor/body-editor/requestReferenceOptions';
import { parseEnhancementArg, type ParsedArg } from '../components/request-editor/utils/parseEnhancementArg';
import type { Connection, MethodWithId } from '../types/connection';
import type { TestMethodDraft } from './testMethod.types';

export type MethodReferenceLocation = 'url' | 'header' | 'body';

export type CollectedReference = {
	reference: string;
	parsed: ParsedArg;
	// Undefined when the reference names a color no method on the canvas carries
	// (the source method was deleted) — the user can still supply a value.
	sourceMethod: MethodWithId | undefined;
	locations: MethodReferenceLocation[];
};

export type CollectedWebhook = {
	name: string;
	type: string;
	locations: MethodReferenceLocation[];
};

export type MethodTestInputs = {
	references: CollectedReference[];
	webhooks: CollectedWebhook[];
};

const WEBHOOK_RE = /\$\{([^}:\s]+)(?::([a-z]+))?\}/g;

const unwrapReference = (match: string) => match.trim().replace(/^\{%\s*/, '').replace(/\s*%}$/, '');

const visitStrings = (value: unknown, visit: (text: string) => void) => {
	if (typeof value === 'string') return visit(value);
	if (Array.isArray(value)) return value.forEach((item) => visitStrings(item, visit));
	if (value && typeof value === 'object') {
		Object.values(value as Record<string, unknown>).forEach((nested) => visitStrings(nested, visit));
	}
};

const addLocation = (locations: MethodReferenceLocation[], location: MethodReferenceLocation) => {
	if (!locations.includes(location)) locations.push(location);
};

const readBodyFields = (body: unknown) =>
	body && typeof body === 'object' && 'fields' in body ? (body as { fields: unknown }).fields : body;

export function collectMethodReferences(draft: TestMethodDraft, connection: Connection): MethodTestInputs {
	const references = new Map<string, CollectedReference>();
	const webhooks = new Map<string, CollectedWebhook>();
	const ownColor = draft.color.toLowerCase();

	const scan = (text: string, location: MethodReferenceLocation) => {
		for (const match of text.matchAll(PAYLOAD_REFERENCE_RE)) {
			const reference = unwrapReference(match[0]);
			const parsed = parseEnhancementArg(reference);
			// The method's own request is what the backend produces while testing,
			// so a self-reference is never an input.
			if (!parsed || (parsed.direction === 'request' && parsed.color.toLowerCase() === ownColor)) continue;
			const existing = references.get(reference);
			if (existing) addLocation(existing.locations, location);
			else references.set(reference, {
				reference,
				parsed,
				sourceMethod: findMethodByColor(connection.fromConnector.method, parsed.color),
				locations: [location],
			});
		}
		for (const match of text.matchAll(WEBHOOK_RE)) {
			const [, name, type = 'string'] = match;
			const existing = webhooks.get(name);
			if (existing) addLocation(existing.locations, location);
			else webhooks.set(name, { name, type, locations: [location] });
		}
	};

	scan(draft.request.endpoint, 'url');
	visitStrings(draft.request.header, (text) => scan(text, 'header'));
	visitStrings(readBodyFields(draft.request.body), (text) => scan(text, 'body'));

	return { references: Array.from(references.values()), webhooks: Array.from(webhooks.values()) };
}
