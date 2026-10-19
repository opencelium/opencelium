export type ServerType = 'String' | 'Number' | 'Boolean' | 'Null' | 'Map' | 'List';

export function toServerArg(value: unknown): unknown {
	if (value !== null && typeof value === 'object') {
		return JSON.parse(
			JSON.stringify(value)
				.replace(/__oc__attributes\./g, '@')
				.replace(/\.__oc__value/g, ''),
		);
	}
	return value;
}

export function toServerResult(value: unknown): {
	value: unknown;
	serverType: ServerType;
} {
	if (value === null || value === undefined) return { value: null, serverType: 'Null' };
	switch (typeof value) {
		case 'string':
			return { value, serverType: 'String' };
		case 'number':
			return { value, serverType: 'Number' };
		case 'boolean':
			return { value, serverType: 'Boolean' };
		case 'object': {
			const list = Array.isArray(value);
			let parsed: unknown;
			try {
				parsed = JSON.parse(JSON.stringify(value));
			} catch {
				throw new Error('invalidResult');
			}
			if (!list && parsed === null) return { value: null, serverType: 'Null' };
			if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) !== list)
				throw new Error('invalidResult');
			return {
				value: parsed,
				serverType: list ? 'List' : 'Map',
			};
		}
		default:
			throw new Error('invalidResult');
	}
}
