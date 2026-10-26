import { describe, expect, it } from 'vitest';
import { buildBodyPreview, buildReferencePreview, replaceReferences, buildTextPreview, hasInputPart, type JsonLine } from './bodyPreview';
import type { PreviewInput } from './previewRequest';
import { connectionFieldSubstitution, referenceSubstitution, webhookSubstitution } from './resolveRequest';

const REFERENCE = '#ffaa00.(response).body.$.id';

const inputs: PreviewInput[] = [
	{ ...referenceSubstitution(REFERENCE, 4730), key: REFERENCE, source: 'reference', isMissing: false },
	{ ...webhookSubstitution('city', undefined), key: 'webhook:city', source: 'webhook', isMissing: true },
	{ ...connectionFieldSubstitution('apikey', '••••'), key: 'connection:apikey', source: 'connection', isMissing: false },
];

const lineText = ({ parts }: JsonLine) => parts.map(function text(part): string {
	if (part.kind !== 'input') return part.text;
	return part.isMissing ? `<${part.source}>` : `[${part.parts.map(text).join('')}]`;
}).join('');

describe('buildBodyPreview', () => {
	it('pretty-prints nested JSON with depth per line', () => {
		const lines = buildBodyPreview({ a: { b: [1, true] }, c: {} }, []);
		expect(lines.map(lineText)).toEqual(['{', '"a": {', '"b": [', '1,', 'true', ']', '},', '"c": {}', '}']);
		expect(lines.map(({ depth }) => depth)).toEqual([0, 1, 2, 3, 3, 2, 1, 1, 0]);
	});

	it('replaces a field holding only an input with the value in its own type', () => {
		const [, line] = buildBodyPreview({ object: `{%${REFERENCE}%}` }, inputs);
		expect(lineText(line)).toBe('"object": [4730]');
	});

	it('marks scalar lines editable with their path, but not values set in Test values', () => {
		const [, reference, name, item] = buildBodyPreview({ object: `{%${REFERENCE}%}`, name: '', list: ['a'] }, inputs);
		expect(reference.edit).toBeUndefined();
		expect(name.edit).toEqual({ path: ['name'], raw: '', prefixLength: 2, hasComma: true });
		expect(item.edit).toBeUndefined();
		const lines = buildBodyPreview({ list: ['a'] }, inputs);
		expect(lines[2].edit).toEqual({ path: ['list', 0], raw: 'a', prefixLength: 0, hasComma: false });
	});

	it('highlights inputs embedded in a string and keeps a placeholder for one without a value', () => {
		const [, line] = buildBodyPreview({ path: '/office/${city}/{apikey}' }, inputs);
		expect(lineText(line)).toBe('"path": "/office/<webhook>/[••••]"');
		const placeholder = line.parts.find((part) => part.kind === 'input');
		expect(placeholder).toMatchObject({ key: 'webhook:city', isMissing: true });
		expect(line.edit).toBeUndefined();
	});
});

describe('buildTextPreview', () => {
	it('keeps header text unquoted and marks every input in it', () => {
		const parts = buildTextPreview('Bearer {apikey} for {%' + REFERENCE + '%}', inputs);
		expect(lineText({ depth: 0, parts })).toBe('Bearer [••••] for [4730]');
		expect(hasInputPart(buildTextPreview('application/json', inputs))).toBe(false);
	});
});

describe('buildReferencePreview', () => {
	it('turns every reference into a placeholder and keeps the text around it', () => {
		const parts = buildReferencePreview(`{url}/user?test={%${REFERENCE}%}&page=2`);
		expect(parts).toEqual([
			{ kind: 'string', text: '{url}/user?test=' },
			{ kind: 'input', key: `{%${REFERENCE}%}`, source: 'reference', isMissing: true, raw: `{%${REFERENCE}%}`, parts: [] },
			{ kind: 'string', text: '&page=2' },
		]);
	});
});

describe('replaceReferences', () => {
	it('swaps each reference for the placeholder and keeps the rest of the text', () => {
		expect(replaceReferences(`https://api.test/user?test={%${REFERENCE}%}&id=${REFERENCE}`, '[set reference]'))
			.toBe('https://api.test/user?test=[set reference]&id=[set reference]');
	});
});
