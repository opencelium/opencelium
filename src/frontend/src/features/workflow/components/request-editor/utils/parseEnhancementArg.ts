// src/core/references/utils/parseEnhancementArg.ts
export interface ParsedArg {
	color: string;
	direction: 'request' | 'response';
	messageProperty: string;
	path: string;
}

export function parseEnhancementArg(value: string): ParsedArg | null {
	const match = value.match(
		/^#([A-Fa-f0-9]{6})\.\((request|response)\)\.([^.]+)(?:\.(?:\$\.)?(.*))?$/
	);
	if (!match) return null;

	const [, color, direction, messageProperty, path] = match;
	const normalizedPath = path === '$' || path === '$.' ? '' : path || '';

	return {
		color: `#${color}`,
		direction: direction as 'request' | 'response',
		messageProperty,
		path: normalizedPath,
	};
}
