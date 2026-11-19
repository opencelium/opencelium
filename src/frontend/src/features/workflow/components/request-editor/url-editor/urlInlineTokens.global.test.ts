import { describe, expect, it } from 'vitest';
import {
	buildInlineHtml,
	buildInlineParts,
	computeRawInsertAtFromVisualCaret,
	getInlineVisualLength,
	parseHtmlToRaw,
	removeInlineTokenByIndex,
} from './urlInlineTokens';

const raw = '{{global.idoitUrl}}/api/#{%a1%}?t={{global.tenants[0].id}}';
const args = { a1: { id: 'a1', source: '#aaaaaa.(response).body.$.id' } };

describe('global references in the endpoint', () => {
	it('splits them into their own parts next to endpoint args', () => {
		expect(buildInlineParts(raw).map((part) => part.kind)).toEqual(['global', 'text', 'arg', 'text', 'global']);
	});

	it('renders a pill that parses back to the same text and has no ref index', () => {
		const html = buildInlineHtml(raw, args);
		expect(parseHtmlToRaw(html, 'oc-endpoint-ref')).toBe(raw);
		expect(html.match(/data-ref-index/g)).toHaveLength(1);
		expect(html).toContain('>idoitUrl</span>');
	});

	it('measures a pill by its label and maps the caret back to raw text', () => {
		expect(getInlineVisualLength('{{global.ab}}x')).toBe(3);
		expect(computeRawInsertAtFromVisualCaret('{{global.ab}}x', 3)).toBe('{{global.ab}}x'.length);
	});

	it('removes endpoint args by index without counting global pills', () => {
		expect(removeInlineTokenByIndex(raw, 0)).toBe('{{global.idoitUrl}}/api/?t={{global.tenants[0].id}}');
	});

	it('leaves an escaped reference as text', () => {
		expect(buildInlineParts('\\{{global.x}}').map((part) => part.kind)).toEqual(['text']);
	});
});
