/**
 * DSL paths are dot paths with `[]` array markers and bare numeric indices (`items.0.id`), as the gateway's
 * prompt describes them. References need OpenCelium's JsonPath tail: `items[0].id`, rooted at `$.`.
 */
export function toJsonPathTail(path: string): string {
	const segments = path.replace(/^\$\.?/, '').split('.').filter(Boolean);
	return segments.reduce((tail, segment) => {
		if (/^\d+$/.test(segment)) return `${tail}[${segment}]`;
		return tail ? `${tail}.${segment}` : segment;
	}, '');
}

export function joinJsonPath(base: string, tail: string): string {
	if (!base) return tail;
	if (!tail) return base;
	return tail.startsWith('[') ? `${base}${tail}` : `${base}.${tail}`;
}

/** The array a loop iterates, without the trailing `[]`/`[*]` the model may or may not write. */
export function toArrayPath(path: string): string {
	return toJsonPathTail(path).replace(/\[\*?]$/, '');
}

/** `#C77E7E.(response).body.$.issues[i].key` — the shape stored in body fields, unwrapped. */
export function buildResponseReference(color: string, jsonPath: string): string {
	return `#${color.replace(/^#/, '').toUpperCase()}.(response).body.$${jsonPath ? `.${jsonPath}` : ''}`;
}

/** Inside a URL the backend only resolves references wrapped in `{%…%}`. */
export function wrapUrlReference(reference: string): string {
	return `{%${reference}%}`;
}
