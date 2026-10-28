import type { HelpSource } from '../model/aiGateway.types';

export type AnswerPart = { kind: 'text'; text: string } | { kind: 'citation'; source: HelpSource };

/** The answer with `[1]`, `[2]`… turned into links to their sources; a number with no source stays text. */
export function splitCitations(text: string, sources: HelpSource[]): AnswerPart[] {
	const parts: AnswerPart[] = [];
	let last = 0;
	for (const match of text.matchAll(/\[(\d+)\]/g)) {
		const source = sources.find((candidate) => candidate.n === Number(match[1]));
		if (!source || match.index === undefined) continue;
		if (match.index > last) parts.push({ kind: 'text', text: text.slice(last, match.index) });
		parts.push({ kind: 'citation', source });
		last = match.index + match[0].length;
	}
	if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
	return parts;
}
