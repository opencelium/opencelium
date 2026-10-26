import { PAYLOAD_REFERENCE_RE } from '../../api/connectionPayload.references';
import { findMethodByColor } from '../../components/request-editor/body-editor/requestReferenceOptions';
import { parseEnhancementArg, type ParsedArg } from '../../components/request-editor/utils/parseEnhancementArg';
import type { Connection, MethodWithId } from '../../types/connection';
import type { PlaygroundDraft } from './playground.types';

export type InputLocation = 'url' | 'header' | 'body';

// Where in this method's request a value lands: the body field path, the header
// name or the query parameter; `null` for a segment of the URL path.
export type InputTarget = { location: InputLocation; property: string | null };

export type CollectedReference = {
	reference: string;
	parsed: ParsedArg;
	// Undefined when the reference names a color no method on the canvas carries
	// (the source method was deleted) — the user can still supply a value.
	sourceMethod: MethodWithId | undefined;
	targets: InputTarget[];
};

export type CollectedWebhook = { name: string; type: string; targets: InputTarget[] };

// A `{field}` placeholder the backend fills from the connector's request data.
export type CollectedConnectionField = { field: string; targets: InputTarget[] };

export type PlaygroundInputs = {
	references: CollectedReference[];
	webhooks: CollectedWebhook[];
	connectionFields: CollectedConnectionField[];
};

const WEBHOOK_RE = /\$\{([^}:\s]+)(?::([a-z]+))?\}/g;
// `${…}` is a webhook parameter and `{%…%}` a reference, so neither may precede or open the braces.
const CONNECTION_FIELD_RE = /(?<![$#])\{([A-Za-z_][\w.-]*)\}/g;

const unwrapReference = (match: string) => match.trim().replace(/^\{%\s*/, '').replace(/\s*%}$/, '');

const visitStrings = (value: unknown, visit: (text: string, path: string) => void, path = '') => {
	if (typeof value === 'string') return visit(value, path);
	if (Array.isArray(value)) return value.forEach((item, index) => visitStrings(item, visit, `${path}[${index}]`));
	if (value && typeof value === 'object') {
		Object.entries(value as Record<string, unknown>)
			.forEach(([key, nested]) => visitStrings(nested, visit, path ? `${path}.${key}` : key));
	}
};

const addTarget = (targets: InputTarget[], target: InputTarget) => {
	if (!targets.some((held) => held.location === target.location && held.property === target.property)) {
		targets.push(target);
	}
};

const upsert = <T extends { targets: InputTarget[] }>(map: Map<string, T>, key: string, target: InputTarget,
	create: () => Omit<T, 'targets'>) => {
	const existing = map.get(key);
	if (existing) addTarget(existing.targets, target);
	else map.set(key, { ...create(), targets: [target] } as T);
};

const queryParamAt = (endpoint: string, offset: number) => {
	const queryStart = endpoint.indexOf('?');
	if (queryStart < 0 || offset < queryStart) return null;
	const pair = endpoint.slice(queryStart + 1, offset).split('&').pop() ?? '';
	return pair.split('=')[0] || null;
};

export const readBodyFields = (body: unknown) =>
	body && typeof body === 'object' && 'fields' in body ? (body as { fields: unknown }).fields : body;

export function collectPlaygroundInputs(draft: PlaygroundDraft, connection: Connection,
	connectionFieldNames: readonly string[]): PlaygroundInputs {
	const references = new Map<string, CollectedReference>();
	const webhooks = new Map<string, CollectedWebhook>();
	const connectionFields = new Map<string, CollectedConnectionField>();
	const knownFields = new Set(connectionFieldNames);
	const ownColor = draft.color.toLowerCase();

	const scan = (text: string, location: InputLocation, property: (offset: number) => string | null) => {
		// A reference in the URL is replaced by typing the value into the URL itself, not in Test values.
		const referenceMatches = location === 'url' ? [] : text.matchAll(PAYLOAD_REFERENCE_RE);
		for (const match of referenceMatches) {
			const reference = unwrapReference(match[0]);
			const parsed = parseEnhancementArg(reference);
			// The method's own request is what the backend produces while testing,
			// so a self-reference is never an input.
			if (!parsed || (parsed.direction === 'request' && parsed.color.toLowerCase() === ownColor)) continue;
			upsert(references, reference, { location, property: property(match.index) }, () => ({
				reference, parsed, sourceMethod: findMethodByColor(connection.fromConnector.method, parsed.color),
			}));
		}
		for (const match of text.matchAll(WEBHOOK_RE)) {
			const [, name, type = 'string'] = match;
			upsert(webhooks, name, { location, property: property(match.index) }, () => ({ name, type }));
		}
		for (const match of text.matchAll(CONNECTION_FIELD_RE)) {
			const field = match[1];
			if (!knownFields.has(field)) continue;
			upsert(connectionFields, field, { location, property: property(match.index) }, () => ({ field }));
		}
	};

	const { endpoint } = draft.request;
	scan(endpoint, 'url', (offset) => queryParamAt(endpoint, offset));
	visitStrings(draft.request.header, (text, path) => scan(text, 'header', () => path || null));
	visitStrings(readBodyFields(draft.request.body), (text, path) => scan(text, 'body', () => path || null));

	return {
		references: Array.from(references.values()),
		webhooks: Array.from(webhooks.values()),
		connectionFields: Array.from(connectionFields.values()),
	};
}
