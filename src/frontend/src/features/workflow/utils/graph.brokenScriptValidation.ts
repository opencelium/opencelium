import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { parseEnhancementArg } from '../components/request-editor/utils/parseEnhancementArg';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { NOT_EXIST_ARG } from './enhancementArgs';
import { normalizeReferenceColor } from './graph.referenceColors';

export type BrokenEnhancementScript = {
	enhanceId: string;
	/** The method whose field this enhancement fills, so the save can flag it and
	 *  pan to it. null when no method on the canvas carries that colour any more —
	 *  the enhancement is then orphaned as well as broken. */
	nodeId: string | null;
	label: string | null;
};

type EnhancementLike = { enhanceId: string; script?: unknown; args?: Record<string, unknown> };

const readEnhancement = (binding: unknown): EnhancementLike | null => {
	const enhancement = (binding as { enhancement?: unknown } | null)?.enhancement;
	if (!enhancement || typeof enhancement !== 'object') return null;
	const candidate = enhancement as Partial<EnhancementLike>;
	return typeof candidate.enhanceId === 'string' ? candidate as EnhancementLike : null;
};

/**
 * Enhancements whose script still names an input that was taken away from it —
 * the VARIABLE_NOT_EXIST a reference cleanup leaves behind (see
 * dropEnhancementArgs). The script cannot run, so a workflow carrying one is not
 * savable: it would execute and fail on the backend for a reason the canvas never
 * showed. Deliberately a marker rather than a silent repair, because only the
 * author of the script knows what should replace the missing value.
 */
export const findBrokenEnhancementScripts = (
	nodes: WorkflowNodeModel[],
	fieldBindings?: readonly unknown[],
): BrokenEnhancementScript[] => {
	if (!Array.isArray(fieldBindings) || fieldBindings.length === 0) return [];

	// The same resolution graph.invalidReferences uses: a method's colour is
	// assigned here when the node does not carry one of its own, and that
	// assignment is what the stored RESULT_VAR was written against. Once per save
	// is well within what this can cost.
	const methodByColor = new Map(buildLegacyConnection(nodes).fromConnector.method
		.map((method) => [normalizeReferenceColor(method.color), method]));

	return fieldBindings.flatMap((binding) => {
		const enhancement = readEnhancement(binding);
		if (!enhancement) return [];
		if (!String(enhancement.script ?? '').includes(NOT_EXIST_ARG)) return [];
		const target = parseEnhancementArg(String(enhancement.args?.RESULT_VAR ?? ''));
		const method = target
			? methodByColor.get(normalizeReferenceColor(target.color))
			: undefined;
		return [{
			enhanceId: enhancement.enhanceId,
			nodeId: method?.id ?? null,
			label: method?.name ?? null,
		}];
	});
};
