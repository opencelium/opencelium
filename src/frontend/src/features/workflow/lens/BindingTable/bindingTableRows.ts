import type { LensBinding, LensBindingGraph } from '../bindingLens.types';

export type BindingTableFilters = {
	search: string;
	brokenOnly: boolean;
};

const matches = (binding: LensBinding, needle: string) =>
	[binding.consumer.label, binding.consumer.path, binding.provider.label, binding.provider.path]
		.some((text) => !!text && text.toLowerCase().includes(needle));

/** Broken first, then by the method the binding feeds and the field inside it:
 *  the table's job the lens cannot do is answering "is anything wrong here", so
 *  the answer sits at the top before anyone sorts a column. */
const compare = (left: LensBinding, right: LensBinding) => {
	const byBroken = Number(!!right.invalidReason) - Number(!!left.invalidReason);
	if (byBroken !== 0) return byBroken;
	const byConsumer = (left.consumer.label ?? '').localeCompare(right.consumer.label ?? '');
	if (byConsumer !== 0) return byConsumer;
	return left.consumer.path.localeCompare(right.consumer.path);
};

export const selectBindingTableRows = (
	graph: LensBindingGraph,
	{ search, brokenOnly }: BindingTableFilters,
): LensBinding[] => {
	const needle = search.trim().toLowerCase();
	return graph.bindings
		.filter((binding) => (!brokenOnly || !!binding.invalidReason)
			&& (!needle || matches(binding, needle)))
		.sort(compare);
};

export const countBroken = (bindings: LensBinding[]) =>
	bindings.filter((binding) => !!binding.invalidReason).length;
