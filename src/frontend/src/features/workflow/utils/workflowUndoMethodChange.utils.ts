import type { WorkflowMethodConfig } from '../types/request-config.types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowUndoChange, WorkflowUndoEnhancementAspect,
	WorkflowUndoMethodSection } from '../types/undoHistory.types';
import { getParsedReferences } from '../components/request-editor/body-editor/bodyReference';
import { sortValue } from './workflowPage.utils';
import { toAuthoredMethodConfig } from './requestConfig';

const stable = (value: unknown) => JSON.stringify(sortValue(value) ?? null);

// An absent header map, an empty one and an empty string all describe the same
// authored state. Without this, a node that had no methodConfig at all would
// read as though every section changed at once.
const isBlank = (value: unknown) => value === undefined || value === null || value === ''
	|| (Array.isArray(value) && value.length === 0)
	|| (typeof value === 'object' && Object.keys(value as object).length === 0);

const same = (left: unknown, right: unknown) =>
	(isBlank(left) && isBlank(right)) || stable(left) === stable(right);

export const workflowNodeLabel = (node: WorkflowNodeModel) =>
	node.data.subtitle?.trim() || node.data.title?.trim() || undefined;

/**
 * Every reference reachable inside a header or body value, keyed by the field
 * path holding it. Keyed rather than flat so replacing a reference in place
 * reads as an edit instead of an add plus a delete.
 */
const collectReferences = (
	value: unknown,
	path: string[] = [],
	into = new Map<string, string[]>(),
): Map<string, string[]> => {
	if (typeof value === 'string') {
		const references = getParsedReferences(value)
			.map((reference) => `${reference.color}.(${reference.type}).${reference.field}`);
		if (references.length) into.set(path.join('.'), references);
		return into;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => collectReferences(item, [...path, String(index)], into));
		return into;
	}
	if (value && typeof value === 'object') {
		Object.entries(value as Record<string, unknown>)
			.forEach(([key, nested]) => collectReferences(nested, [...path, key], into));
	}
	return into;
};

/** Every leaf of a header/body payload, keyed by its field path. */
const flatten = (value: unknown, path: string[] = [],
	into = new Map<string, unknown>()): Map<string, unknown> => {
	if (value === null || typeof value !== 'object') {
		into.set(path.join('.'), value);
		return into;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => flatten(item, [...path, String(index)], into));
		return into;
	}
	Object.entries(value as Record<string, unknown>)
		.forEach(([key, nested]) => flatten(nested, [...path, key], into));
	return into;
};

const bearsReference = (value: unknown) =>
	typeof value === 'string' && getParsedReferences(value).length > 0;

/**
 * True when the section's *literal* content moved — ignoring any field that
 * holds a reference on either side, since that field's change is already
 * reported as a reference change. Without this split, adding a reference would
 * always look like two changes at once (the reference, plus the value it
 * replaced) and could never be labelled as just the reference.
 */
const literalContentChanged = (before: unknown, after: unknown) => {
	const previous = flatten(before);
	const next = flatten(after);
	for (const path of new Set([...previous.keys(), ...next.keys()])) {
		const left = previous.get(path);
		const right = next.get(path);
		if (bearsReference(left) || bearsReference(right)) continue;
		if (stable(left) !== stable(right)) return true;
	}
	return false;
};

const referenceCount = (references: Map<string, string[]>) =>
	[...references.values()].reduce((total, list) => total + list.length, 0);

const compareReferences = (before: unknown, after: unknown) => {
	const previous = collectReferences(before);
	const next = collectReferences(after);
	if (stable([...previous.entries()].sort()) === stable([...next.entries()].sort())) return null;
	const previousCount = referenceCount(previous);
	const nextCount = referenceCount(next);
	if (nextCount > previousCount) return 'added' as const;
	if (nextCount < previousCount) return 'removed' as const;
	return 'edited' as const;
};

/**
 * Narrows a method-config edit to the editor tab it came from — the URL/query
 * fields, the headers, or the body — and, when the edit was to a reference
 * inside the headers or body, says whether one was added, deleted or replaced.
 * Falls back to the generic `method-config` when nothing more specific fits.
 */
export const describeMethodConfigChange = (
	before: WorkflowMethodConfig | undefined,
	after: WorkflowMethodConfig | undefined,
	name?: string,
	/** An enhancement edit that arrived in the same entry — the request dialog
	 * persists the config and the field bindings together, so a script edit shows
	 * up alongside an otherwise unremarkable body write. */
	enhancement?: { section: WorkflowUndoMethodSection;
		aspect: WorkflowUndoEnhancementAspect } | null,
): WorkflowUndoChange => {
	const previous = toAuthoredMethodConfig(before);
	const next = toAuthoredMethodConfig(after);

	const section = (
		key: WorkflowUndoMethodSection,
		before: unknown,
		after: unknown,
		extraChanged = false,
	) => {
		const references = compareReferences(before, after);
		const literal = literalContentChanged(before, after) || extraChanged;
		// Adding or removing a reference creates or drops its binding
		// (updateRequestFieldBindings), so an enhancement delta that arrives with a
		// reference delta is the same action — not a second, independent change.
		const enhanced = enhancement?.section === key && references === null;
		return {
			key,
			references,
			enhanced,
			signals: [references !== null, literal, enhanced].filter(Boolean).length,
		};
	};

	const header = section('header', previous?.headers, next?.headers);
	const body = section('body', previous?.body, next?.body,
		!same(previous?.bodyFormat, next?.bodyFormat) || !same(previous?.bodyData, next?.bodyData));
	// The URL editor owns the endpoint, the verb, the query rows and the endpoint
	// args that back its inline reference tokens.
	const urlChanged = !same(previous?.url, next?.url)
		|| !same(previous?.method, next?.method)
		|| !same(previous?.queryParams, next?.queryParams)
		|| !same(previous?.endpointArgs, next?.endpointArgs);

	const touched = [header, body].filter((part) => part.signals > 0);
	if (touched.length > 1 || (touched.length === 1 && urlChanged)) return { kind: 'multiple' };

	const [only] = touched;
	if (only) {
		// Several independent edits inside one section: name the section rather
		// than pick one of them and misreport the rest.
		if (only.signals > 1) {
			return only.key === 'header'
				? { kind: 'method-header', name }
				: { kind: 'method-body', name };
		}
		if (only.references) {
			return { kind: 'method-reference', section: only.key,
				operation: only.references, name };
		}
		if (only.enhanced && enhancement) {
			return { kind: 'method-enhancement', section: enhancement.section,
				aspect: enhancement.aspect, name };
		}
		return only.key === 'header'
			? { kind: 'method-header', name }
			: { kind: 'method-body', name };
	}

	if (urlChanged) return { kind: 'method-url', name };
	return { kind: 'method-config', name };
};

const RESULT_VAR_RE = /^(#[A-Fa-f0-9]{6})\.\((?:request|response)\)\.(header|body)\b/;

type EnhancementLike = {
	enhanceId?: string;
	language?: string;
	description?: string;
	script?: string;
	args?: Record<string, string>;
};

type BindingLike = { enhancement?: EnhancementLike };

// Which field of an enhancement moved. Removal wins outright; otherwise the
// metadata fields are checked before the script, since a script diff is the
// catch-all and would otherwise mask them.
const aspectOf = (
	before: EnhancementLike | undefined,
	after: EnhancementLike | undefined,
): WorkflowUndoEnhancementAspect => {
	if (before && !after) return 'removed';
	// An enhancement appearing from nothing is about its behaviour, not about the
	// language it happens to default to.
	if (!before) return 'script';
	const changed: WorkflowUndoEnhancementAspect[] = [];
	if (before.language !== after?.language) changed.push('language');
	if ((before.description ?? '') !== (after?.description ?? '')) changed.push('description');
	if (before.script !== after?.script
		|| stable(before.args) !== stable(after?.args)) changed.push('script');
	// One dialog session is one entry, so a visit that changed the language, the
	// script and the description must not be reported as only one of them.
	return changed.length === 1 ? changed[0] : 'multiple';
};

const enhancementsById = (bindings: unknown[] | undefined) => {
	const result = new Map<string, NonNullable<BindingLike['enhancement']>>();
	(bindings ?? []).forEach((binding) => {
		const enhancement = (binding as BindingLike)?.enhancement;
		if (enhancement?.enhanceId) result.set(enhancement.enhanceId, enhancement);
	});
	return result;
};

/**
 * Which method and which section an enhancement edit belongs to. Scripts live in
 * the connection-level field bindings rather than on the node, and
 * `args.RESULT_VAR` (`#C77E7E.(request).body.$.path`) is what ties one back to
 * its method's colour and the section it writes into.
 */
export const findChangedEnhancementTarget = (
	previousBindings: unknown[] | undefined,
	nextBindings: unknown[] | undefined,
): {
	color: string;
	section: WorkflowUndoMethodSection;
	aspect: WorkflowUndoEnhancementAspect;
} | null => {
	const previous = enhancementsById(previousBindings);
	const next = enhancementsById(nextBindings);
	const touchedId = [...new Set([...previous.keys(), ...next.keys()])]
		.find((id) => stable(previous.get(id)) !== stable(next.get(id)));
	if (!touchedId) return null;
	const before = previous.get(touchedId);
	const after = next.get(touchedId);
	const match = RESULT_VAR_RE.exec(String((after ?? before)?.args?.RESULT_VAR ?? ''));
	if (!match) return null;
	const [, color, section] = match;
	return {
		color,
		section: section as WorkflowUndoMethodSection,
		aspect: aspectOf(before, after),
	};
};

/** Label for an edit that touched only the field bindings. */
export const describeEnhancementChange = (
	previousBindings: unknown[] | undefined,
	nextBindings: unknown[] | undefined,
	nodes: WorkflowNodeModel[],
): WorkflowUndoChange => {
	const target = findChangedEnhancementTarget(previousBindings, nextBindings);
	if (!target) return { kind: 'references' };
	const owner = nodes.find((node) =>
		(node.data.color ?? '').toLowerCase() === target.color.toLowerCase());
	return {
		kind: 'method-enhancement',
		section: target.section,
		aspect: target.aspect,
		name: owner && workflowNodeLabel(owner),
		...(owner ? { icon: { kind: 'connector' as const,
			iconUrl: owner.data.connector?.icon ?? null } } : {}),
	};
};
