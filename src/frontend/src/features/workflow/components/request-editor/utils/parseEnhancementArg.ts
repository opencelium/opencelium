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

// Shared structural-path label for a parsed reference (e.g. "body.$.items[0].name"
// or "status") — used as the tooltip/dialog title wherever a reference's own
// display label isn't already provided by the caller (see BodyPointer, EndpointArgHoverTooltip).
export function formatParsedArgPath(parsed: ParsedArg): string {
	return parsed.path ? `${parsed.messageProperty}.$.${parsed.path}` : `${parsed.messageProperty}.$`;
}
