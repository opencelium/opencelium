import type { PreviewInput, PreviewInputSource } from './previewRequest';

export type JsonTokenKind = 'syntax' | 'key' | 'string' | 'number' | 'literal';

export type JsonPart =
	| { kind: JsonTokenKind; text: string }
	// A missing input has no parts; the view shows a placeholder for its source instead.
	| { kind: 'input'; key: string; source: PreviewInputSource; isMissing: boolean; parts: JsonPart[] };

export type BodyPath = (string | number)[];

// A scalar the user can edit in place: `parts` holds `prefixLength` key parts, then the
// value, then the trailing comma when `hasComma`.
export type LineEdit = { path: BodyPath; raw: unknown; prefixLength: number; hasComma: boolean };

export type JsonLine = { depth: number; parts: JsonPart[]; edit?: LineEdit };

const syntax = (text: string): JsonPart => ({ kind: 'syntax', text });

const escapeString = (text: string) => JSON.stringify(text).slice(1, -1);

const inputPart = ({ key, source, isMissing, value }: PreviewInput, toParts: (value: unknown) => JsonPart[]): JsonPart =>
	({ kind: 'input', key, source, isMissing, parts: isMissing ? [] : toParts(value) });

// A value dropped in by an input renders on one line, whatever its type.
const inlineValue = (value: unknown): JsonPart[] => {
	if (typeof value === 'string') return [{ kind: 'string', text: JSON.stringify(value) }];
	if (typeof value === 'number') return [{ kind: 'number', text: String(value) }];
	if (typeof value === 'boolean' || value === null) return [{ kind: 'literal', text: String(value) }];
	return [{ kind: 'syntax', text: JSON.stringify(value) ?? '' }];
};

const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

const findNextInput = (text: string, from: number, inputs: PreviewInput[]) => {
	let next: { index: number; length: number; input: PreviewInput } | null = null;
	for (const input of inputs) {
		// Matching over the whole text keeps the lookbehind of a connection-field pattern intact.
		const pattern = new RegExp(input.pattern.source, 'g');
		pattern.lastIndex = from;
		const match = pattern.exec(text);
		if (match && (!next || match.index < next.index)) next = { index: match.index, length: match[0].length, input };
	}
	return next;
};

const splitText = (text: string, inputs: PreviewInput[], escape: (text: string) => string): JsonPart[] => {
	const parts: JsonPart[] = [];
	let cursor = 0;
	for (let next = findNextInput(text, 0, inputs); next; next = findNextInput(text, cursor, inputs)) {
		if (next.index > cursor) parts.push({ kind: 'string', text: escape(text.slice(cursor, next.index)) });
		parts.push(inputPart(next.input, (value) => [{ kind: 'string', text: escape(asText(value)) }]));
		cursor = next.index + next.length;
	}
	if (cursor < text.length) parts.push({ kind: 'string', text: escape(text.slice(cursor)) });
	return parts;
};

// Plain text (a header value) with each input it embeds highlighted in place.
export const buildTextPreview = (text: string, inputs: PreviewInput[]) => splitText(text, inputs, (part) => part);

export const hasInputPart = (parts: JsonPart[]) => parts.some((part) => part.kind === 'input');

// A string that embeds inputs stays one quoted string with each input highlighted inside it.
const stringParts = (text: string, inputs: PreviewInput[]): JsonPart[] => {
	const whole = inputs.find((input) => input.whole.test(text.trim()));
	if (whole) return [inputPart(whole, inlineValue)];
	return [{ kind: 'string', text: '"' }, ...splitText(text, inputs, escapeString), { kind: 'string', text: '"' }];
};

// Pretty-prints the request body as JSON lines, marking every value a test input fills in.
export function buildBodyPreview(body: unknown, inputs: PreviewInput[]): JsonLine[] {
	const lines: JsonLine[] = [];
	const visit = (value: unknown, depth: number, path: BodyPath, prefix: JsonPart[], suffix: string) => {
		const isArray = Array.isArray(value);
		if (value && typeof value === 'object') {
			const entries: [string | number, unknown][] = isArray
				? value.map((item, index) => [index, item])
				: Object.entries(value as Record<string, unknown>);
			const [open, close] = isArray ? ['[', ']'] : ['{', '}'];
			if (!entries.length) {
				lines.push({ depth, parts: [...prefix, syntax(`${open}${close}${suffix}`)] });
				return;
			}
			lines.push({ depth, parts: [...prefix, syntax(open)] });
			entries.forEach(([key, nested], index) => visit(nested, depth + 1, [...path, key],
				typeof key === 'number' ? [] : [{ kind: 'key', text: JSON.stringify(key) }, syntax(': ')],
				index < entries.length - 1 ? ',' : ''));
			lines.push({ depth, parts: [syntax(`${close}${suffix}`)] });
			return;
		}
		const parts = typeof value === 'string' ? stringParts(value, inputs) : inlineValue(value);
		// A value that is one input as a whole is set in Test values, not here.
		const isWholeInput = parts.length === 1 && parts[0].kind === 'input';
		lines.push({ depth, parts: [...prefix, ...parts, ...(suffix ? [syntax(suffix)] : [])],
			edit: isWholeInput ? undefined : { path, raw: value, prefixLength: prefix.length, hasComma: !!suffix } });
	};
	visit(body, 0, [], [], '');
	return lines;
}
