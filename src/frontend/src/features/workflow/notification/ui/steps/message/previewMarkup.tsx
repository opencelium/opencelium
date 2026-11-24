import type { ReactNode } from 'react';
import { REFERENCE_TOKEN_RE } from '../../../model/notificationBody';
import type { ReferenceDescription } from '../../references/referenceDescription';

type Markup = 'slack' | 'markdown';

// Order matters: links before emphasis so link text keeps its own formatting out of the way.
const PATTERNS: Record<Markup, { re: RegExp; tag: 'b' | 'i' | 'u'; group: number }[]> = {
	slack: [
		{ re: /<([^|>]+)\|([^>]+)>/, tag: 'u', group: 2 },
		{ re: /\*([^*\n]+)\*/, tag: 'b', group: 1 },
		{ re: /_([^_\n]+)_/, tag: 'i', group: 1 },
	],
	markdown: [
		{ re: /\[([^\]]+)\]\(([^)]+)\)/, tag: 'u', group: 1 },
		{ re: /\*\*([^*\n]+)\*\*/, tag: 'b', group: 1 },
		{ re: /(?<![*\w])\*([^*\n]+)\*(?!\*)/, tag: 'i', group: 1 },
	],
};

const formatText = (text: string, markup: Markup, keyPrefix: string): ReactNode[] => {
	let best: { index: number; length: number; tag: 'b' | 'i' | 'u'; inner: string } | null = null;
	for (const pattern of PATTERNS[markup]) {
		const match = pattern.re.exec(text);
		if (match && (!best || match.index < best.index)) {
			best = { index: match.index, length: match[0].length, tag: pattern.tag, inner: match[pattern.group] };
		}
	}
	if (!best) return [text];
	const Tag = best.tag;
	return [
		text.slice(0, best.index),
		<Tag key={`${keyPrefix}-${best.index}`}>{formatText(best.inner, markup, `${keyPrefix}-${best.index}i`)}</Tag>,
		...formatText(text.slice(best.index + best.length), markup, `${keyPrefix}-${best.index}r`),
	];
};

/**
 * Simplified rendering of a tool's inline markup. References become chips first so a
 * `*` or `_` inside a JSON path is never read as emphasis.
 */
export const renderPreviewMarkup = (
	value: string,
	markup: Markup,
	describe: (reference: string) => ReferenceDescription,
): ReactNode[] => {
	const nodes: ReactNode[] = [];
	let lastIndex = 0;
	for (const match of value.matchAll(new RegExp(REFERENCE_TOKEN_RE.source, 'g'))) {
		nodes.push(...formatText(value.slice(lastIndex, match.index), markup, `t${lastIndex}`));
		const info = describe(match[1]);
		nodes.push(
			<span key={`r${match.index}`} className='notificationRefChip notificationRefChip--static' title={info.token}>
				<i style={{ background: info.color }} />{info.methodLabel} · {info.path}
			</span>,
		);
		lastIndex = match.index + match[0].length;
	}
	nodes.push(...formatText(value.slice(lastIndex), markup, `t${lastIndex}`));
	return nodes;
};
