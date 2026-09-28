import { buildWorkflowIndexes } from '../api/connectionPayload';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { InvalidReference } from './graph.dragDrop.types';
import { collectFullReferences, collectReferenceColors, normalizeReferenceColor,
	referenceColorOf } from './graph.referenceColors';

const ITERATOR_RE = /\[([A-Za-z_]\w*)\]/g;

const isConsumer = (node: WorkflowNodeModel) => node.type === 'connector'
	|| node.type === 'system' || node.type === 'trigger-connection'
	|| node.type === 'if' || node.type === 'loop';

const collectIteratorUses = (value: unknown, uses: Map<string, Set<string>>, skipEnhancement: boolean) =>
	collectFullReferences(value, skipEnhancement).forEach((reference) => {
		const color = referenceColorOf(reference);
		for (const [, iterator] of reference.matchAll(ITERATOR_RE)) {
			uses.set(iterator, new Set([...(uses.get(iterator) ?? []), color]));
		}
	});

type FieldBinding = { enhancement?: { args?: Record<string, unknown> } };

/**
 * A `[i]` in a reference path reads the current element of the loop whose
 * iterator is `i`, so it only resolves while the consumer sits inside that
 * loop. Colour-based validation cannot see this: the provider is still before
 * the consumer after it leaves the loop, only the iterator is gone.
 */
export const findOutOfScopeIteratorReferences = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	consumerNodeIds: Set<string>,
	fieldBindings?: unknown[],
): InvalidReference[] => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const loops = nodes.filter((node) => node.type === 'loop')
		.map((node) => ({ index: indexes.get(node.id), iterator: node.data.conditionConfig?.iterator }))
		.filter((loop): loop is { index: string; iterator: string } => !!loop.index && !!loop.iterator);
	const iteratorsInScope = (nodeIndex: string) => new Set(loops
		.filter((loop) => nodeIndex.startsWith(`${loop.index}_`))
		.map((loop) => loop.iterator));
	const bindingsByConsumerColor = new Map<string, FieldBinding[]>();
	(Array.isArray(fieldBindings) ? fieldBindings as FieldBinding[] : []).forEach((binding) => {
		const color = [...collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '')][0];
		if (color) bindingsByConsumerColor.set(color, [...(bindingsByConsumerColor.get(color) ?? []), binding]);
	});

	return nodes.flatMap((node) => {
		const nodeIndex = indexes.get(node.id);
		if (!consumerNodeIds.has(node.id) || !isConsumer(node) || !nodeIndex) return [];
		const uses = new Map<string, Set<string>>();
		collectIteratorUses(node.data, uses, true);
		(bindingsByConsumerColor.get(normalizeReferenceColor(node.data.color)) ?? [])
			.forEach((binding) => collectIteratorUses(Object.fromEntries(
				Object.entries(binding.enhancement?.args ?? {}).filter(([key]) => key !== 'RESULT_VAR'),
			), uses, false));
		const inScope = iteratorsInScope(nodeIndex);
		return [...uses]
			.filter(([iterator]) => !inScope.has(iterator))
			.flatMap(([iterator, colors]) => [...colors]
				.map((sourceColor) => ({ consumerNodeId: node.id, sourceColor, iterator })));
	});
};
