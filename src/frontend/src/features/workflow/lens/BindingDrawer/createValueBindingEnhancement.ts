import { createShortId } from '@shared/lib/createId';
import {
	buildBodyEnhancement,
	getParsedReferences,
	parseReference,
	type ParsedReference,
} from '../../components/request-editor/body-editor/bodyReference';
import { resolveMethodIdentities } from '../../components/request-editor/legacyConnectionBuilder';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { LensBinding } from '../bindingLens.types';
import { collectValueReferences } from '../collectValueReferences';

export type ValueBindingEnhancement = {
	fieldBindings: unknown[];
	/** Key of the clicked reference once it is described by the new enhancement. */
	bindingKey: string;
};

const formatReference = (reference: ParsedReference) =>
	`${reference.color}.(${reference.type}).${reference.field}`.toLowerCase();

/**
 * The drawer's counterpart of the body editor's "Create enhancement"
 * (createDirectReferenceEnhancement): same enhancement, same refusal for a value
 * with text around its reference, which a script result would overwrite.
 */
export const createValueBindingEnhancement = (
	binding: LensBinding,
	nodes: WorkflowNodeModel[],
	fieldBindings: readonly unknown[] | undefined,
): ValueBindingEnhancement | null => {
	const { nodeId, path } = binding.consumer;
	if (binding.source.kind !== 'value' || !nodeId) return null;
	const node = nodes.find((item) => item.id === nodeId);
	const target = collectValueReferences(node?.data.methodConfig).targets
		.find((item) => `value:${nodeId}:${item.path}:${item.reference}` === binding.key);
	if (!target) return null;
	const references = getParsedReferences(target.value);
	if (references.length === 0) return null;

	// The method's colour as the editors spell it, not the lens's lowercased one:
	// the body editor finds a field's enhancement by an exact RESULT_VAR match.
	const methodColor = resolveMethodIdentities(nodes)
		.find((method) => method.id === nodeId)?.color ?? binding.consumer.color;
	const enhanceId = createShortId();
	const enhancement = buildBodyEnhancement(enhanceId, `${methodColor}.(request).${path}`,
		references);
	const clicked = parseReference(target.reference);
	const index = clicked
		? references.findIndex((item) => formatReference(item) === formatReference(clicked))
		: -1;
	return {
		fieldBindings: [...(fieldBindings ?? []), { enhancement }],
		bindingKey: `${enhanceId}:VAR_${Math.max(index, 0)}`,
	};
};
