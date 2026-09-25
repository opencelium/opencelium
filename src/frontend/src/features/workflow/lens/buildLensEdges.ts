import type { LensBinding, LensEdgeData, LensEdgeModel } from './bindingLens.types';
import type { LensActions } from './buildLensElements';
import { bindingAnchorNodeId } from './buildLensSummary';
import { lensPairEdgeId } from './lensIds';

const baseEdge = {
	type: 'binding-lens-edge' as const,
	className: 'bindingLensEdge',
	selectable: false,
	focusable: false,
	deletable: false,
	zIndex: 1,
};

/** One arc per provider→consumer pair, for pairs with neither end expanded. */
export const buildLensPairEdges = (
	bindings: LensBinding[],
	selectedKey: string | null,
	actions: LensActions,
): LensEdgeModel[] => {
	const grouped = new Map<string, { source: string; target: string; bindings: LensBinding[] }>();

	bindings.forEach((binding) => {
		const source = bindingAnchorNodeId(binding);
		const target = binding.consumer.nodeId;
		if (!source || !target) return;
		const key = `${source}->${target}`;
		const group = grouped.get(key) ?? { source, target, bindings: [] };
		group.bindings.push(binding);
		grouped.set(key, group);
	});

	return [...grouped.values()].map(({ source, target, bindings: pair }) => {
		const invalidCount = pair.filter((binding) => !!binding.invalidReason).length;
		// A pair standing for a single binding has nothing worth expanding into:
		// clicking it goes straight to that binding's editor.
		const isSingle = pair.length === 1;
		const data: LensEdgeData = {
			variant: 'pair',
			providerLabel: pair.find((binding) => binding.provider.label)?.provider.label ?? null,
			consumerLabel: pair[0].consumer.label,
			count: pair.length,
			invalidCount,
			hasScript: pair.some((binding) => binding.isScript),
			bindingKeys: pair.map((binding) => binding.key),
			isSelected: pair.some((binding) => binding.key === selectedKey),
			activates: isSingle ? 'select' : 'expand',
			onActivate: isSingle
				? () => actions.onSelectBinding(pair[0].key)
				: () => actions.onExpandPair([source, target]),
		};
		return {
			...baseEdge,
			id: lensPairEdgeId(source, target),
			source,
			target,
			// Bindings hang below the row on the bottom/left handles, so they never
			// trace the same line as the flow edge between the same two nodes.
			sourceHandle: 'bottom',
			targetHandle: 'left',
			data,
		} satisfies LensEdgeModel;
	});
};
