import type { MethodWithId } from '../../../types/connection';

export { getEligibleReferenceMethods } from '../../../utils/referenceMethodVisibility';

export const getReferenceFilterTerm = (value: string) => {
	const normalized = String(value || '');
	const splitIndex = Math.max(normalized.lastIndexOf('.'), normalized.lastIndexOf(']'));
	const segment = splitIndex >= 0 ? normalized.slice(splitIndex + 1) : normalized;
	// An unfinished bracket (`servers[`, `node['`) is operation syntax being typed, not a key prefix.
	const bracketIndex = segment.lastIndexOf('[');
	return (bracketIndex >= 0 ? segment.slice(bracketIndex) : segment).toLowerCase();
};

export const getReferenceMethodLabel = (method: MethodWithId) =>
	String(method.label || method.name || (method as any).index || method.id);
