import type { LensBinding, LensBindingGraph } from '../bindingLens.types';
import { type FieldBindingGroup, groupBindingsByField } from '../groupBindingsByField';

export type BindingTableFilters = {
	search: string;
};

/** A filled field, and each of its sources as a sub-row under it. */
export type BindingTableRow =
	| { kind: 'field'; group: FieldBindingGroup }
	| { kind: 'source'; binding: LensBinding };

const matches = (binding: LensBinding, needle: string) =>
	[binding.consumer.label, binding.consumer.path, binding.provider.label, binding.provider.path]
		.some((text) => !!text && text.toLowerCase().includes(needle));

/** Broken first, then by the method the field belongs to and the field inside it:
 *  the table's job the lens cannot do is answering "is anything wrong here", so
 *  the answer sits at the top before anyone sorts a column. */
const compare = (left: FieldBindingGroup, right: FieldBindingGroup) => {
	const byBroken = Number(right.invalidCount > 0) - Number(left.invalidCount > 0);
	if (byBroken !== 0) return byBroken;
	const byConsumer = (left.consumer.label ?? '').localeCompare(right.consumer.label ?? '');
	if (byConsumer !== 0) return byConsumer;
	return left.consumer.path.localeCompare(right.consumer.path);
};

/** One row per filled field. A search hit on any of its sources keeps the whole
 *  row, so the field is never shown with only part of what feeds it. */
export const selectBindingTableRows = (
	graph: LensBindingGraph,
	{ search }: BindingTableFilters,
): FieldBindingGroup[] => {
	const needle = search.trim().toLowerCase();
	return groupBindingsByField(graph.bindings)
		.filter((group) => !needle || group.bindings.some((binding) => matches(binding, needle)))
		.sort(compare);
};

export const toFieldRows = (groups: FieldBindingGroup[]): BindingTableRow[] =>
	groups.map((group) => ({ kind: 'field', group }));

export const getSourceRows = (row: BindingTableRow): BindingTableRow[] | undefined =>
	row.kind === 'field'
		? row.group.bindings.map((binding) => ({ kind: 'source', binding }))
		: undefined;

export const getRowBindings = (row: BindingTableRow): LensBinding[] =>
	row.kind === 'field' ? row.group.bindings : [row.binding];

export const getBindingTableRowId = (row: BindingTableRow) =>
	row.kind === 'field' ? row.group.key : row.binding.key;

export const countBroken = (bindings: LensBinding[]) =>
	bindings.filter((binding) => !!binding.invalidReason).length;
