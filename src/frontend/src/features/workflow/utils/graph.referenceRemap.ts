import type { ParsedArg } from '../components/request-editor/utils/parseEnhancementArg';
import { parseEnhancementArg } from '../components/request-editor/utils/parseEnhancementArg';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { normalizeReferenceColor } from './graph.referenceColors';

/**
 * Where a doomed reference should point instead.
 *
 * Two levels, because a reference names two things. `colors` re-points a whole
 * method — the colour *is* a method's identity in a stored reference, so
 * substituting it re-reads the same field from somewhere else. `references`
 * overrides single references on top of that, which is what a replacement whose
 * response is shaped differently needs: `body.$.id` on the old method may be
 * `body.$.user.id` on the new one, and keeping the path would leave a reference
 * that resolves to nothing while looking perfectly valid.
 *
 * Keys are normalized: lower-case colour, and for `references` the whole
 * reference string as `#rrggbb.(response).body.$.path`.
 */
export type ReferenceRemapPlan = {
	colors: ReadonlyMap<string, string>;
	references: ReadonlyMap<string, string>;
	/** Conditions rewritten by hand, by operator node id. Some conditions cannot
	 *  be answered by substitution at all — a rule whose left side stops meaning
	 *  anything once its method is gone has to be rewritten, not re-pointed — so
	 *  the dialog lets the operator's own editor produce one, and stages it here
	 *  until the deletion is confirmed. */
	conditionConfigs?: ReadonlyMap<string, ConditionConfig>;
};

export const EMPTY_REMAP_PLAN: ReferenceRemapPlan = {
	colors: new Map(),
	references: new Map(),
	conditionConfigs: new Map(),
};

export const isEmptyRemapPlan = (plan: ReferenceRemapPlan) =>
	plan.colors.size === 0 && plan.references.size === 0
	&& (plan.conditionConfigs?.size ?? 0) === 0;

/** The canonical form of one reference, so a key written `#7ED321` matches a
 *  reference stored as `#7ed321`. */
export const referenceKey = (parsed: ParsedArg) =>
	buildReference({ ...parsed, color: normalizeReferenceColor(parsed.color) });

export function buildReference({ color, direction, messageProperty, path }: ParsedArg) {
	const tail = path ? `.$.${path}` : messageProperty === 'status' ? '' : '.$';
	return `${color}.(${direction}).${messageProperty}${tail}`;
}

/* Anchored on the `.(request)` / `.(response)` tail every stored reference
   carries. A method's own `data.color` is a bare `#3F8AB4` with no tail, so a
   rewrite cannot reach it and turn one method into another — the one mistake in
   this file that would be silent and unrecoverable. */
const REFERENCE_TOKEN_RE = /#([A-Fa-f0-9]{6})(\.\((?:request|response)\))/g;
/* An operator condition keeps its references wrapped, which is what gives them
   a terminator inside an otherwise free-text expression. */
const CONDITION_TOKEN_RE = /\{%(#?[A-Fa-f0-9]{6}\.\((?:request|response)\)\.[^%]*)%\}/g;

/** Colour substitution alone, for a reference embedded in text that cannot be
 *  parsed as a whole: the path stays, which is the best that can be said about
 *  a reference nothing could take apart. */
const remapColorsOnly = (value: string, plan: ReferenceRemapPlan) =>
	value.replace(REFERENCE_TOKEN_RE, (token, color: string, tail: string) => {
		const next = plan.colors.get(normalizeReferenceColor(`#${color}`));
		return next ? `${next}${tail}` : token;
	});

/** One whole reference: the precise override first, then the method-wide one. */
const remapReference = (value: string, plan: ReferenceRemapPlan) => {
	const parsed = parseEnhancementArg(value);
	if (!parsed) return remapColorsOnly(value, plan);
	const override = plan.references.get(referenceKey(parsed));
	if (override) return override;
	const color = plan.colors.get(normalizeReferenceColor(parsed.color));
	return color ? buildReference({ ...parsed, color }) : value;
};

/* Values hold either one reference or a `;`-separated list of them (the shape
   removeColors filters on), so each part is a whole reference and can be taken
   apart. Parts that do not change keep their original spacing rather than being
   rebuilt — a value nobody re-pointed should come back byte for byte. */
const remapString = (value: string, plan: ReferenceRemapPlan) => {
	const unwrapped = value.replace(CONDITION_TOKEN_RE, (token, inner: string) => {
		const next = remapReference(inner.startsWith('#') ? inner : `#${inner}`, plan);
		return next === inner ? token : `{%${next}%}`;
	});
	return unwrapped.split(';').map((part) => {
		const trimmed = part.trim();
		if (!trimmed) return part;
		const next = remapReference(trimmed, plan);
		return next === trimmed ? part : part.replace(trimmed, next);
	}).join(';');
};

const remapValue = <T>(value: T, plan: ReferenceRemapPlan): T => {
	if (typeof value === 'string') return remapString(value, plan) as T;
	if (Array.isArray(value)) return value.map((item) => remapValue(item, plan)) as T;
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value as Record<string, unknown>)
			.map(([key, nested]) => [key, remapValue(nested, plan)])) as T;
	}
	return value;
};

/**
 * `from` carries each provider as a bare colour beside the reference strings, so
 * it is the one place no token rewrite can reach. It is positional — `from[N]`
 * is the provider of `VAR_N` (see graph.fieldBindingClone) — so it is restated
 * from the arguments as they now read rather than remapped on its own: with
 * every reference free to name a different method, there is no longer one
 * colour a whole binding moves to. `to` is the consumer and never moves;
 * nothing about which field is being filled changes.
 *
 * Called on the already-remapped binding, which is what makes the arguments the
 * source of truth here.
 */
const restateBindingProviders = (binding: unknown) => {
	if (!binding || typeof binding !== 'object') return binding;
	const from = (binding as { from?: unknown }).from;
	if (!Array.isArray(from)) return binding;
	const args = (binding as { enhancement?: { args?: Record<string, unknown> } })
		.enhancement?.args ?? {};
	return {
		...(binding as Record<string, unknown>),
		from: from.map((item, index) => {
			const arg = args[`VAR_${index}`];
			const parsed = typeof arg === 'string' ? parseEnhancementArg(arg) : null;
			const current = (item as { color?: unknown } | null)?.color;
			// Untouched when it already names the same method: a colour stored in
			// another case is not a change worth writing into someone's connection.
			if (!parsed || (typeof current === 'string'
				&& normalizeReferenceColor(current) === normalizeReferenceColor(parsed.color))) {
				return item;
			}
			return { ...(item as Record<string, unknown>), color: parsed.color };
		}),
	};
};

export const remapNodeDataReferences = (
	data: WorkflowNodeModel['data'],
	plan: ReferenceRemapPlan,
): WorkflowNodeModel['data'] => remapValue(data, plan);

/**
 * Every reference to a doomed method, re-pointed at what the user chose in its
 * place — the alternative to `cleanInvalidWorkflowReferences`, which is the only
 * thing a deletion could do with them until now.
 *
 * Untouched inputs are returned by identity when the plan is empty: the undo
 * stack records on a signature of this state, and a fresh object graph with
 * identical content would read as an edit nobody made.
 */
export const remapWorkflowReferences = (
	nodes: WorkflowNodeModel[],
	fieldBindings: unknown[] | undefined,
	plan: ReferenceRemapPlan,
) => {
	if (isEmptyRemapPlan(plan)) return { nodes, fieldBindings };
	return {
		// The hand-written condition is applied after the substitution rather than
		// through it: it is the more specific answer, the same way a field's own
		// answer outranks the method-wide one. Rewriting it again would edit
		// something the user just wrote.
		nodes: nodes.map((node) => {
			const data = remapNodeDataReferences(node.data, plan);
			const rewritten = plan.conditionConfigs?.get(node.id);
			return { ...node, data: rewritten ? { ...data, conditionConfig: rewritten } : data };
		}),
		fieldBindings: Array.isArray(fieldBindings)
			? fieldBindings.map((binding) => restateBindingProviders(remapValue(binding, plan)))
			: fieldBindings,
	};
};
