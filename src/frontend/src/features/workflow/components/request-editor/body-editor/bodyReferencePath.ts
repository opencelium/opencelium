const normalizeBodySegment = (segment: string) => {
	const value = String(segment || '').trim();
	const indexMatch = value.match(/^\[?(\d+)]?$/);
	return indexMatch ? `[${indexMatch[1]}]` : value;
};

export const buildRequestResultField = (
	messageProperty: 'body' | 'header',
	namespace: string[] = [],
	name = '',
) => {
	const parts = [...namespace, name]
		.filter(Boolean)
		.map((item) => normalizeBodySegment(item));
	return `${messageProperty}.$.${parts.join('.').replace(/\.\./g, '.')}`.replace(/\.$/, '');
};

export const parseFieldPath = (path: string) => {
	const segments = String(path || '')
		.split('.')
		.filter(Boolean)
		.map((segment) => segment.match(/^\[(\d+)]$/)?.[1] ?? segment);
	const name = segments.pop() || '';
	return { namespace: segments, name };
};

export const resolveFieldPathAgainstSource = (
	source: unknown,
	path: string,
): { namespace: string[]; name: string } => {
	const segments = String(path || '')
		.split('.')
		.filter(Boolean)
		.map((segment) => segment.match(/^\[(\d+)]$/)?.[1] ?? segment);

	const resolve = (current: unknown, remaining: string[]): string[] | null => {
		if (remaining.length === 0) return [];
		for (let take = 1; take <= remaining.length; take += 1) {
			const candidateKey = remaining.slice(0, take).join('.');
			let next: unknown;
			if (Array.isArray(current)) {
				if (take !== 1) continue;
				const index = Number(remaining[0]);
				if (Number.isNaN(index)) continue;
				next = current[index];
			} else if (current && typeof current === 'object'
				&& candidateKey in (current as Record<string, unknown>)) {
				next = (current as Record<string, unknown>)[candidateKey];
			} else {
				continue;
			}
			const rest = resolve(next, remaining.slice(take));
			if (rest !== null) return [candidateKey, ...rest];
		}
		return null;
	};

	const resolved = resolve(source, segments) ?? segments;
	const name = resolved.pop() || '';
	return { namespace: resolved, name };
};
