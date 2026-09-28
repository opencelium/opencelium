import type { InvalidReference } from './graph.dragDrop.types';

const REFERENCE_COLOR_RE = /#[A-Fa-f0-9]{6}\.\((?:request|response)\)/g;

export const normalizeReferenceColor = (color?: string) => color?.startsWith('#')
	? color.toLowerCase()
	: color ? `#${color}`.toLowerCase() : '';

const collectColors = (value: unknown, skipEnhancement: boolean) => {
	const colors = new Set<string>();
	const visit = (next: unknown) => {
		if (typeof next === 'string') {
			next.match(REFERENCE_COLOR_RE)?.forEach((reference) =>
				colors.add(normalizeReferenceColor(reference.split('.')[0])));
			return;
		}
		if (Array.isArray(next)) {
			next.forEach(visit);
			return;
		}
		if (next && typeof next === 'object') {
			Object.entries(next as Record<string, unknown>).forEach(([key, nested]) => {
				if (!skipEnhancement || key !== 'enhancement') visit(nested);
			});
		}
	};
	visit(value);
	return colors;
};

export const collectReferenceColors = (value: unknown) => collectColors(value, false);
export const collectNodeReferenceColors = (value: unknown) => collectColors(value, true);

const FULL_REFERENCE_RE = /#[A-Fa-f0-9]{6}\.\((?:request|response)\)[^\s'"{}%;]*/g;

export const collectFullReferences = (value: unknown, skipEnhancement = false): string[] => {
	if (typeof value === 'string') return value.match(FULL_REFERENCE_RE) ?? [];
	if (Array.isArray(value)) return value.flatMap((item) => collectFullReferences(item, skipEnhancement));
	if (value && typeof value === 'object') {
		return Object.entries(value as Record<string, unknown>)
			.filter(([key]) => !skipEnhancement || key !== 'enhancement')
			.flatMap(([, nested]) => collectFullReferences(nested, skipEnhancement));
	}
	return [];
};

export const referenceColorOf = (reference: string) => normalizeReferenceColor(reference.split('.')[0]);

/** True when `value` holds at least one reference the matcher was built to remove. */
export type ReferenceMatcher = (value: unknown) => boolean;

export const buildReferenceMatcher = (
	refs: Pick<InvalidReference, 'sourceColor' | 'iterator'>[],
): ReferenceMatcher => {
	const wholeColors = new Set(refs.filter((ref) => !ref.iterator).map((ref) => ref.sourceColor));
	const iteratorRefs = refs.filter((ref) => ref.iterator);
	return (value) => collectFullReferences(value).some((reference) => {
		const color = referenceColorOf(reference);
		return wholeColors.has(color) || iteratorRefs.some((ref) =>
			ref.sourceColor === color && reference.includes(`[${ref.iterator}]`));
	});
};

export const uniqueReferences = (refs: InvalidReference[]) => {
	const seen = new Set<string>();
	return refs.filter((ref) => {
		const key = `${ref.consumerNodeId}:${ref.sourceColor}:${ref.iterator ?? ''}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

export const replaceReferenceColors = (
	value: unknown,
	colorMap: Map<string, string>,
): unknown => {
	if (typeof value === 'string') {
		let result = value;
		colorMap.forEach((nextColor, previousColor) => {
			result = result.replace(new RegExp(previousColor, 'gi'), nextColor);
		});
		return result;
	}
	if (Array.isArray(value)) return value.map((item) =>
		replaceReferenceColors(item, colorMap));
	if (value && typeof value === 'object') return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([key, nested]) =>
			[key, replaceReferenceColors(nested, colorMap)]),
	);
	return value;
};
