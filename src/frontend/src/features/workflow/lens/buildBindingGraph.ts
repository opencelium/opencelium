import { buildWorkflowIndexes } from '../api/connectionPayload';
import { isDirectReferenceEnhancement } from '../components/request-editor/body-editor/bodyReference';
import { resolveMethodIdentities } from '../components/request-editor/legacyConnectionBuilder';
import {
	formatParsedArgPath,
	parseEnhancementArg,
	type ParsedArg,
} from '../components/request-editor/utils/parseEnhancementArg';
import type { Enhancement } from '../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { NOT_EXIST_ARG } from '../utils/enhancementArgs';
import { normalizeReferenceColor } from '../utils/graph.referenceColors';
import { pickNearestVisibleProvider } from '../utils/graph.referenceProvider';
import { compareWorkflowIndexes } from '../utils/graph.referenceVisibility';
import type { LensBinding, LensBindingGraph, LensEndpoint } from './bindingLens.types';
import { collectValueReferences } from './collectValueReferences';

// The lens covers request body and header targets. Operator conditions and
// aggregator args are not field bindings at all, and endpoint/query-param
// references live on node data under the URL — counted as out of scope (see
// collectValueReferences) rather than described.
const TARGET_MESSAGE_PROPERTIES = new Set(['body', 'header']);

type MethodInfo = {
	nodeId: string;
	color: string;
	label: string;
	index?: string;
};

const isVarKey = (key: string) => /^VAR_\d+$/.test(key);

const readEnhancement = (binding: unknown): Enhancement | null => {
	const enhancement = (binding as { enhancement?: unknown } | null)?.enhancement;
	if (!enhancement || typeof enhancement !== 'object') return null;
	const candidate = enhancement as Partial<Enhancement>;
	if (typeof candidate.enhanceId !== 'string' || !candidate.args) return null;
	return candidate as Enhancement;
};

// Colours come from the legacy method identities rather than node.data.color
// directly: a node without an authored colour is assigned one there, and that
// assignment is what the stored references were written against.
const buildMethodIndex = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const byColor = new Map<string, MethodInfo[]>();
	const byNodeId = new Map<string, MethodInfo>();
	resolveMethodIdentities(nodes).forEach((method) => {
		const color = normalizeReferenceColor(method.color);
		if (!color) return;
		const info: MethodInfo = {
			nodeId: method.id,
			color,
			label: method.name,
			index: indexes.get(method.id),
		};
		byColor.set(color, [...(byColor.get(color) ?? []), info]);
		byNodeId.set(method.id, info);
	});
	return { byColor, byNodeId };
};

const toEndpoint = (parsed: ParsedArg, method: MethodInfo | null): LensEndpoint => ({
	nodeId: method?.nodeId ?? null,
	label: method?.label ?? null,
	color: normalizeReferenceColor(parsed.color),
	direction: parsed.direction,
	messageProperty: parsed.messageProperty,
	field: parsed.path,
	path: formatParsedArgPath(parsed),
});

/** Identifies one reference filling one field, whichever side it was read from —
 *  creating an enhancement leaves the reference in the field value, so the same
 *  binding is visible in both places and must only be described once. */
const referenceIdentity = (consumerNodeId: string, consumerPath: string, parsed: ParsedArg) =>
	[consumerNodeId, consumerPath, normalizeReferenceColor(parsed.color), parsed.direction,
		parsed.messageProperty, parsed.path].join('|');

export const buildBindingGraph = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings: readonly unknown[] | undefined,
): LensBindingGraph => {
	const bindings: LensBinding[] = [];
	const skipped = { malformed: 0, outsideScope: 0, unanchored: 0 };
	const methods = buildMethodIndex(nodes, edges);
	const described = new Set<string>();

	/** The method the reference is read from, and the one it names but cannot read
	 *  (so a broken binding still has something to point at). */
	const resolveProvider = (parsed: ParsedArg, consumer: MethodInfo) => {
		const candidates = methods.byColor.get(normalizeReferenceColor(parsed.color)) ?? [];
		const provider = pickNearestVisibleProvider(candidates,
			(candidate) => candidate.index, consumer.index);
		const named = [...candidates].sort((left, right) =>
			compareWorkflowIndexes(right.index ?? '', left.index ?? ''))[0];
		return {
			provider: provider ?? null,
			invalidReason: provider ? null
				: candidates.length === 0 ? 'missing-method' as const : 'out-of-scope' as const,
			unreadableProviderNodeId: provider ? null : named?.nodeId ?? null,
		};
	};

	if (Array.isArray(fieldBindings)) {
		fieldBindings.forEach((binding) => {
			const enhancement = readEnhancement(binding);
			if (!enhancement) {
				skipped.malformed += 1;
				return;
			}
			const target = parseEnhancementArg(String(enhancement.args.RESULT_VAR ?? ''));
			if (!target) {
				skipped.malformed += 1;
				return;
			}
			if (!TARGET_MESSAGE_PROPERTIES.has(target.messageProperty)) {
				skipped.outsideScope += 1;
				return;
			}
			// A colour identifies one method instance (a method used twice gets two
			// colours), so the first match is the consumer.
			const consumerMethod = methods.byColor.get(normalizeReferenceColor(target.color))?.[0];
			if (!consumerMethod) {
				skipped.unanchored += 1;
				return;
			}
			const consumer = toEndpoint(target, consumerMethod);
			const isScript = !isDirectReferenceEnhancement(enhancement);
			// A script still naming an input that is no longer passed to it cannot
			// run, so every binding it stands for is broken — whether or not the
			// references it does still have resolve.
			const hasMissingVariable = String(enhancement.script ?? '').includes(NOT_EXIST_ARG);
			const references = Object.entries(enhancement.args).filter(([key]) => isVarKey(key));
			if (references.length === 0) {
				// Nothing left to draw an arc from, but the field it fills is real and
				// the break is the whole point of showing it: without this the case
				// where a script lost *every* input was visible nowhere.
				if (!hasMissingVariable) {
					skipped.malformed += 1;
					return;
				}
				bindings.push({
					key: `${enhancement.enhanceId}:script`,
					source: { kind: 'enhancement', enhanceId: enhancement.enhanceId, varKey: null },
					consumer,
					provider: {
						nodeId: null, label: null, color: '', direction: 'response',
						messageProperty: '', field: '', path: NOT_EXIST_ARG,
					},
					isScript,
					invalidReason: 'missing-variable',
					unreadableProviderNodeId: null,
				});
				return;
			}

			references.forEach(([varKey, value]) => {
				const parsed = parseEnhancementArg(String(value ?? ''));
				if (!parsed) {
					skipped.malformed += 1;
					return;
				}
				described.add(referenceIdentity(consumerMethod.nodeId, consumer.path, parsed));
				const resolved = resolveProvider(parsed, consumerMethod);
				bindings.push({
					key: `${enhancement.enhanceId}:${varKey}`,
					source: { kind: 'enhancement', enhanceId: enhancement.enhanceId, varKey },
					consumer,
					provider: toEndpoint(parsed, resolved.provider),
					isScript,
					// A provider-side break is the more specific fact about this
					// reference, so it wins; the script's own break is what the
					// otherwise-fine references of that enhancement report.
					invalidReason: resolved.invalidReason
						?? (hasMissingVariable ? 'missing-variable' : null),
					unreadableProviderNodeId: resolved.unreadableProviderNodeId,
				});
			});
		});
	}

	// The other half: references written straight into a field's value, which is
	// what the body and header pickers produce and what no fieldBindings entry
	// ever mentions.
	nodes.forEach((node) => {
		const consumerMethod = methods.byNodeId.get(node.id);
		if (!consumerMethod) return;
		const { targets, outsideScope } = collectValueReferences(node.data.methodConfig);
		skipped.outsideScope += outsideScope;
		targets.forEach((target) => {
			const parsed = parseEnhancementArg(target.reference);
			if (!parsed) {
				skipped.malformed += 1;
				return;
			}
			if (described.has(referenceIdentity(node.id, target.path, parsed))) return;
			const resolved = resolveProvider(parsed, consumerMethod);
			bindings.push({
				key: `value:${node.id}:${target.path}:${target.reference}`,
				source: { kind: 'value' },
				consumer: {
					nodeId: node.id,
					label: consumerMethod.label,
					color: consumerMethod.color,
					direction: 'request',
					messageProperty: target.messageProperty,
					field: target.field,
					path: target.path,
				},
				provider: toEndpoint(parsed, resolved.provider),
				// A reference in a field value is the field's whole value or part of
				// its text; either way nothing computes it.
				isScript: false,
				invalidReason: resolved.invalidReason,
				unreadableProviderNodeId: resolved.unreadableProviderNodeId,
			});
		});
	});

	return { bindings, skipped };
};
