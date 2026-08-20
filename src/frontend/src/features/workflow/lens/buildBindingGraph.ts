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
import { normalizeReferenceColor } from '../utils/graph.referenceColors';
import { pickNearestVisibleProvider } from '../utils/graph.referenceProvider';
import { compareWorkflowIndexes } from '../utils/graph.referenceVisibility';
import type { LensBinding, LensBindingGraph, LensEndpoint } from './bindingLens.types';

// Phase 1 of the binding lens covers request body and header only. Endpoint and
// query-param references, operator conditions and aggregator args are not field
// bindings at all — they live on node data — so a target outside this set is a
// binding the lens deliberately does not describe.
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
const buildMethodsByColor = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const byColor = new Map<string, MethodInfo[]>();
	resolveMethodIdentities(nodes).forEach((method) => {
		const color = normalizeReferenceColor(method.color);
		if (!color) return;
		byColor.set(color, [...(byColor.get(color) ?? []), {
			nodeId: method.id,
			color,
			label: method.name,
			index: indexes.get(method.id),
		}]);
	});
	return byColor;
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

export const buildBindingGraph = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings: readonly unknown[] | undefined,
): LensBindingGraph => {
	const bindings: LensBinding[] = [];
	const skipped = { malformed: 0, outsideScope: 0, unanchored: 0 };
	if (!Array.isArray(fieldBindings) || fieldBindings.length === 0) {
		return { bindings, skipped };
	}

	const methodsByColor = buildMethodsByColor(nodes, edges);

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
		const consumerMethod = methodsByColor.get(normalizeReferenceColor(target.color))?.[0];
		if (!consumerMethod) {
			skipped.unanchored += 1;
			return;
		}
		const consumer = toEndpoint(target, consumerMethod);
		const isScript = !isDirectReferenceEnhancement(enhancement);
		const references = Object.entries(enhancement.args).filter(([key]) => isVarKey(key));
		if (references.length === 0) {
			skipped.malformed += 1;
			return;
		}

		references.forEach(([varKey, value]) => {
			const parsed = parseEnhancementArg(String(value ?? ''));
			if (!parsed) {
				skipped.malformed += 1;
				return;
			}
			const candidates = methodsByColor.get(normalizeReferenceColor(parsed.color)) ?? [];
			const providerMethod = pickNearestVisibleProvider(
				candidates,
				(candidate) => candidate.index,
				consumerMethod.index,
			);
			// The last method carrying the colour, visible or not: what the
			// reference names, so a broken edge still has something to point at.
			const namedMethod = [...candidates].sort((left, right) =>
				compareWorkflowIndexes(right.index ?? '', left.index ?? ''))[0];
			bindings.push({
				key: `${enhancement.enhanceId}:${varKey}`,
				enhanceId: enhancement.enhanceId,
				varKey,
				consumer,
				provider: toEndpoint(parsed, providerMethod),
				isScript,
				invalidReason: providerMethod ? null
					: candidates.length === 0 ? 'missing-method' : 'out-of-scope',
				unreadableProviderNodeId: providerMethod ? null
					: namedMethod?.nodeId ?? null,
			});
		});
	});

	return { bindings, skipped };
};
