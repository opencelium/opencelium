import { tokenizer, type Token } from 'acorn';

export function hasNashornSyntax(script: string, position: number): boolean {
	const tokens: Token[] = [];
	try {
		for (const token of tokenizer(script, { ecmaVersion: 'latest' })) tokens.push(token);
	} catch {
		// Inspect the tokens collected before malformed input.
	}
	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		if (
			token.type.label === 'for' &&
			tokens[index + 1]?.type.label === 'name' &&
			script.slice(tokens[index + 1].start, tokens[index + 1].end) === 'each' &&
			tokens[index + 2]?.type.label === '('
		) {
			if (position >= token.start && position <= tokens[index + 2].end) return true;
		}
		if (token.type.label !== 'function') continue;
		let cursor = index + 1;
		if (tokens[cursor]?.type.label === 'name') cursor++;
		if (tokens[cursor]?.type.label !== '(') continue;
		let depth = 0;
		do {
			if (tokens[cursor].type.label === '(') depth++;
			if (tokens[cursor].type.label === ')') depth--;
			cursor++;
		} while (cursor < tokens.length && depth > 0);
		const body = tokens[cursor];
		if (!body || depth || ['{', ';', ',', ')', '}', ']', '=>'].includes(body.type.label)) continue;
		if (position >= token.start && position <= body.end) return true;
	}
	return false;
}
