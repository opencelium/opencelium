import type { LensBinding, LensEndpoint } from './bindingLens.types';

/** Every reference filling one field through one source — one enhancement, or
 *  the field's own value. Two enhancements on the same field stay two groups, so
 *  a group always maps to exactly one editor. */
export type FieldBindingGroup = {
	key: string;
	consumer: LensEndpoint;
	/** Broken references first, otherwise in the order they were described. */
	bindings: LensBinding[];
	invalidCount: number;
};

export const fieldGroupKey = (binding: LensBinding) => [
	binding.consumer.nodeId ?? binding.consumer.color,
	binding.consumer.path,
	binding.source.kind === 'enhancement' ? binding.source.enhanceId : 'value',
].join('|');

export const groupBindingsByField = (bindings: readonly LensBinding[]): FieldBindingGroup[] => {
	const groups = new Map<string, LensBinding[]>();
	bindings.forEach((binding) => {
		const key = fieldGroupKey(binding);
		groups.set(key, [...(groups.get(key) ?? []), binding]);
	});
	return [...groups].map(([key, members]) => ({
		key,
		consumer: members[0].consumer,
		bindings: [...members].sort((left, right) =>
			Number(!!right.invalidReason) - Number(!!left.invalidReason)),
		invalidCount: members.filter((binding) => !!binding.invalidReason).length,
	}));
};
