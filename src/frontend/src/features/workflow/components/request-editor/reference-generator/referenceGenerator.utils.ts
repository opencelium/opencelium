import type { MethodWithId } from '../../../types/connection';

export { getEligibleReferenceMethods } from '../../../utils/referenceMethodVisibility';

export const getReferenceFilterTerm = (value: string) => {
	const normalized = String(value || '');
	const splitIndex = Math.max(normalized.lastIndexOf('.'), normalized.lastIndexOf(']'));
	return (splitIndex >= 0 ? normalized.slice(splitIndex + 1) : normalized).toLowerCase();
};

export const getReferenceMethodLabel = (method: MethodWithId) =>
	String(method.label || method.name || (method as any).index || method.id);
