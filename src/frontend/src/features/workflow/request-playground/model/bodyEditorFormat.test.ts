import { describe, expect, it } from 'vitest';
import { formatBodyForEditor, parseEditedBody } from './bodyEditorFormat';

describe('the playground raw body editor', () => {
	it('edits the step fields of an XML body as XML', () => {
		expect(formatBodyForEditor({ a: { __oc__attributes: null, __oc__value: '1' } }, 'xml')).toBe('<a>1</a>');
		expect(parseEditedBody('<?xml version="1.0"?><a>2</a>', 'xml'))
			.toEqual({ ok: true, body: { a: { __oc__attributes: null, __oc__value: '2' } } });
	});

	it('does not take a root element named fields for the body wrapper', () => {
		const body = { fields: { __oc__attributes: null, a: { __oc__attributes: null, __oc__value: '1' } } };
		expect(formatBodyForEditor(body, 'xml')).toBe('<fields>\n  <a>1</a>\n</fields>');
		expect(parseEditedBody('<fields><a>1</a></fields>', 'xml')).toEqual({ ok: true, body });
	});

	it('keeps every key of a JSON body switched to XML visible under one root', () => {
		expect(formatBodyForEditor({ name: 'n', items: [1, 2] }, 'xml'))
			.toBe('<root>\n  <name>n</name>\n  <items>1</items>\n  <items>2</items>\n</root>');
		expect(formatBodyForEditor({ _declaration: {}, a: { __oc__value: '1' } }, 'xml')).toBe('<a>1</a>');
	});

	it('says why an edit is not taken', () => {
		expect(parseEditedBody('<a>x<b/></a>', 'xml')).toEqual({ ok: false, xmlError: { kind: 'mixedContent' } });
		expect(parseEditedBody('{ "a": ', 'json')).toEqual({ ok: false });
	});
});
