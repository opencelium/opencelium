import { buildRequestResultField } from '../components/request-editor/body-editor/bodyReferencePath';
import type { WorkflowMethodConfig } from '../types/request-config.types';

export type ValueReferenceTarget = {
	messageProperty: 'body' | 'header';
	/** Display path, in the same shape an enhancement's RESULT_VAR yields for the
	 *  same field — so a field bound both ways merges into one row. */
	path: string;
	/** The field inside the message property; '' means the whole message. */
	field: string;
	/** The reference as stored, e.g. '#3fa9f5.(response).body.$.id'. */
	reference: string;
};

export type NodeValueReferences = {
	targets: ValueReferenceTarget[];
	/** References on the URL, its endpoint args or its query params: real bindings
	 *  this lens does not describe (it covers body and header targets), counted so
	 *  their absence can be stated rather than read as "there are none". */
	outsideScope: number;
};

// Unanchored on purpose: a value is usually a reference on its own, but the body
// editor also accepts a mixed one ("Bearer #aabbcc.(response).body.$.token" — see
// hasMixedReferenceValue), and a reference the engine will substitute is a
// binding whether or not it fills the whole field.
const REFERENCE_RE =
	/#[A-Fa-f0-9]{6}\.\((?:request|response)\)\.(?:header|body|status)(?:\.[^\s;"']*)?/g;

const EMPTY: NodeValueReferences = { targets: [], outsideScope: 0 };

// Keyed on the config object rather than the node: a drag replaces the node and
// its data wrapper but never the method config, so walking every body on the
// canvas stays a once-per-edit cost instead of a once-per-frame one.
const cache = new WeakMap<WorkflowMethodConfig, NodeValueReferences>();

const readReferences = (value: unknown): string[] =>
	typeof value === 'string' ? value.match(REFERENCE_RE) ?? [] : [];

const stripPrefix = (path: string, messageProperty: string) => {
	const prefix = `${messageProperty}.$.`;
	return path.startsWith(prefix) ? path.slice(prefix.length) : '';
};

const collectFromBody = (body: unknown, targets: ValueReferenceTarget[]) => {
	const visit = (value: unknown, segments: string[]) => {
		if (Array.isArray(value)) {
			value.forEach((item, index) => visit(item, [...segments, String(index)]));
			return;
		}
		if (value && typeof value === 'object') {
			Object.entries(value as Record<string, unknown>).forEach(([key, nested]) =>
				visit(nested, [...segments, key]));
			return;
		}
		const references = readReferences(value);
		if (references.length === 0) return;
		const path = buildRequestResultField('body', segments.slice(0, -1),
			segments[segments.length - 1] ?? '');
		references.forEach((reference) => targets.push({
			messageProperty: 'body', path, field: stripPrefix(path, 'body'), reference,
		}));
	};
	visit(body, []);
};

const collectOutsideScope = (config: WorkflowMethodConfig) => {
	const found = new Set<string>();
	const visit = (value: unknown) => {
		if (Array.isArray(value)) return value.forEach(visit);
		if (value && typeof value === 'object') {
			return Object.values(value as Record<string, unknown>).forEach(visit);
		}
		readReferences(value).forEach((reference) => found.add(reference.toLowerCase()));
	};
	visit(config.url);
	visit(config.queryParams);
	visit(config.endpointArgs);
	return found.size;
};

/**
 * The references a method carries in its own field values — a plain direct
 * reference, which is what the body/header pickers write and which has no entry
 * in `fieldBindings` at all (an enhancement is only created when the user asks
 * for a script; see createDirectReferenceEnhancement). Without this the lens
 * described the rarer half of the bindings in a workflow.
 */
export const collectValueReferences = (
	config: WorkflowMethodConfig | undefined,
): NodeValueReferences => {
	if (!config) return EMPTY;
	const cached = cache.get(config);
	if (cached) return cached;

	const targets: ValueReferenceTarget[] = [];
	Object.entries(config.headers ?? {}).forEach(([key, value]) => {
		const path = buildRequestResultField('header', [], key);
		readReferences(value).forEach((reference) => targets.push({
			messageProperty: 'header', path, field: stripPrefix(path, 'header'), reference,
		}));
	});
	collectFromBody(config.body, targets);

	const result: NodeValueReferences = { targets, outsideScope: collectOutsideScope(config) };
	cache.set(config, result);
	return result;
};
