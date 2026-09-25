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

export const uniqueReferences = (refs: InvalidReference[]) => {
	const seen = new Set<string>();
	return refs.filter((ref) => {
		const key = `${ref.consumerNodeId}:${ref.sourceColor}`;
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
