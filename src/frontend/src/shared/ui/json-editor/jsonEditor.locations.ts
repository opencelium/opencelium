export type JsonTextPosition = { row: number; column: number };

const toPosition = (text: string, offset: number): JsonTextPosition => {
	const before = text.slice(0, offset);
	const lines = before.split('\n');
	return { row: lines.length - 1, column: lines.at(-1)?.length ?? 0 };
};

export const findJsonPathPositions = (text: string) => {
	const positions = new Map<string, JsonTextPosition>();
	let cursor = 0;
	const whitespace = () => { while (/\s/.test(text[cursor] ?? '')) cursor += 1; };
	const readString = () => {
		const start = cursor++;
		while (cursor < text.length) {
			if (text[cursor] === '\\') cursor += 2;
			else if (text[cursor++] === '"') break;
		}
		try { return { value: JSON.parse(text.slice(start, cursor)) as string, start }; }
		catch { return { value: '', start }; }
	};
	const readValue = (path: string[]): void => {
		whitespace();
		if (text[cursor] === '{') {
			cursor += 1; whitespace();
			while (cursor < text.length && text[cursor] !== '}') {
				if (text[cursor] !== '"') return;
				const key = readString();
				whitespace();
				if (text[cursor++] !== ':') return;
				const childPath = [...path, key.value];
				positions.set(childPath.join('.'), toPosition(text, key.start));
				readValue(childPath); whitespace();
				if (text[cursor] === ',') { cursor += 1; whitespace(); } else break;
			}
			if (text[cursor] === '}') cursor += 1;
			return;
		}
		if (text[cursor] === '[') {
			cursor += 1; whitespace();
			let index = 0;
			while (cursor < text.length && text[cursor] !== ']') {
				const childPath = [...path, String(index++)];
				positions.set(childPath.join('.'), toPosition(text, cursor));
				readValue(childPath); whitespace();
				if (text[cursor] === ',') { cursor += 1; whitespace(); } else break;
			}
			if (text[cursor] === ']') cursor += 1;
			return;
		}
		if (text[cursor] === '"') readString();
		else while (cursor < text.length && !/[\s,}\]]/.test(text[cursor])) cursor += 1;
	};
	readValue([]);
	return positions;
};

export const findJsonSyntaxErrorPosition = (text: string, message: string) => {
	const offset = Number(message.match(/position\s+(\d+)/i)?.[1]);
	if (Number.isFinite(offset)) return toPosition(text, Math.min(offset, text.length));

	let cursor = 0;
	let errorOffset: number | null = null;
	const fail = () => { if (errorOffset === null) errorOffset = cursor; };
	const whitespace = () => { while (/\s/.test(text[cursor] ?? '')) cursor += 1; };
	const string = () => {
		if (text[cursor++] !== '"') { fail(); return; }
		while (cursor < text.length) {
			const char = text[cursor++];
			if (char === '"') return;
			if (char === '\\') {
				if (!/["\\/bfnrtu]/.test(text[cursor] ?? '')) { fail(); return; }
				if (text[cursor] === 'u' && !/^[0-9a-f]{4}$/i.test(text.slice(cursor + 1, cursor + 5))) {
					fail(); return;
				}
				cursor += text[cursor] === 'u' ? 5 : 1;
			} else if (char.charCodeAt(0) < 32) { fail(); return; }
		}
		fail();
	};
	const value = (): void => {
		whitespace();
		if (errorOffset !== null) return;
		if (text[cursor] === '"') { string(); return; }
		if (text[cursor] === '{') {
			cursor += 1; whitespace();
			if (text[cursor] === '}') { cursor += 1; return; }
			while (cursor < text.length && errorOffset === null) {
				if (text[cursor] !== '"') { fail(); return; }
				string(); whitespace();
				if (text[cursor] !== ':') { fail(); return; }
				cursor += 1; value(); whitespace();
				if (text[cursor] === '}') { cursor += 1; return; }
				if (text[cursor] !== ',') { fail(); return; }
				cursor += 1; whitespace();
			}
			fail(); return;
		}
		if (text[cursor] === '[') {
			cursor += 1; whitespace();
			if (text[cursor] === ']') { cursor += 1; return; }
			while (cursor < text.length && errorOffset === null) {
				value(); whitespace();
				if (text[cursor] === ']') { cursor += 1; return; }
				if (text[cursor] !== ',') { fail(); return; }
				cursor += 1; whitespace();
			}
			fail(); return;
		}
		const token = text.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|^(?:true|false|null)/)?.[0];
		if (!token) { fail(); return; }
		cursor += token.length;
	};
	whitespace(); value(); whitespace();
	if (errorOffset === null && cursor < text.length) fail();
	return errorOffset === null ? null : toPosition(text, errorOffset);
};
