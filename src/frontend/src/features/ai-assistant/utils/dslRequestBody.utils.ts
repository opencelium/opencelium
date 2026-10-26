type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** A literal assigned to a whole array field (`article[]`) may be JSON the model wrote out; otherwise it is one item. */
function toArrayValue(value: string, isLiteral: boolean): unknown[] {
	if (isLiteral) {
		try {
			const parsed: unknown = JSON.parse(value);
			if (Array.isArray(parsed)) return parsed;
		} catch {
			// Not JSON: the text is the single item.
		}
	}
	return [value];
}

/**
 * Sets `value` at a DSL body path inside the operation's body template, creating missing objects on the way.
 * `article[].body` writes into the first array element, which is what the invoker template declares.
 */
export function setBodyField(fields: JsonObject, path: string, value: string, isLiteral: boolean): void {
	const segments = path.split('.').filter(Boolean);
	let target: JsonObject = fields;
	segments.forEach((segment, position) => {
		const isLast = position === segments.length - 1;
		const isArray = segment.endsWith('[]');
		const key = isArray ? segment.slice(0, -2) : segment;

		if (isLast) {
			target[key] = isArray ? toArrayValue(value, isLiteral) : value;
			return;
		}
		if (isArray) {
			const current = Array.isArray(target[key]) ? (target[key] as unknown[]) : [];
			const first = isObject(current[0]) ? current[0] : {};
			target[key] = [first, ...current.slice(1)];
			target = first;
			return;
		}
		const next = isObject(target[key]) ? (target[key] as JsonObject) : {};
		target[key] = next;
		target = next;
	});
}
