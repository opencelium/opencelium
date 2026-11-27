import { describe, expect, it } from 'vitest';
import { checkXmlName, parseXmlBody, serializeXmlBody, XML_MAX_DEPTH } from './xmlBody';
import { createTreeFromCompactXml, serializeCompactXml } from '../components/request-editor/body-editor/xml/xmlTree';

const fieldsOf = (xml: string) => {
	const parsed = parseXmlBody(xml);
	if (!parsed.ok) throw new Error(`expected ${xml} to parse, got ${parsed.error.kind}`);
	return parsed.fields;
};
const errorOf = (xml: string) => {
	const parsed = parseXmlBody(xml);
	return parsed.ok ? null : parsed.error;
};
const leaf = (text: string) => ({ __oc__attributes: null, __oc__value: text });

describe('parseXmlBody', () => {
	it('leaves the declaration out, so the body keeps the single top-level key the backend needs', () => {
		const fields = fieldsOf('<?xml version="1.0" encoding="UTF-8"?>\n<note><to>Tove</to></note>');
		expect(fields).toEqual({ note: { __oc__attributes: null, to: leaf('Tove') } });
	});

	it('stores an empty element with an empty text, which the backend sends as an empty element', () => {
		expect(fieldsOf('<a><b/><c></c></a>')).toEqual({ a: { __oc__attributes: null, b: leaf(''), c: leaf('') } });
	});

	it('takes whitespace between elements as layout, on one line or several', () => {
		const expected = { a: { __oc__attributes: null, b: leaf('1'), c: leaf('2') } };
		expect(fieldsOf('<a><b>1</b> <c>2</c></a>')).toEqual(expected);
		expect(fieldsOf('<a>\n  <b>1</b>\n  <c>2</c>\n</a>')).toEqual(expected);
	});

	it('keeps attributes, namespaces, repeated elements and CDATA', () => {
		expect(fieldsOf('<ns:a xmlns:ns="urn:x" ns:id="1"><ns:b>v</ns:b><ns:b><![CDATA[x < y]]></ns:b></ns:a>')).toEqual({
			'ns:a': { __oc__attributes: { 'xmlns:ns': 'urn:x', 'ns:id': '1' }, 'ns:b': [leaf('v'), leaf('x < y')] },
		});
	});

	it('keeps elements named like members of a JavaScript object apart', () => {
		expect(fieldsOf('<a><constructor>1</constructor><toString>2</toString></a>'))
			.toEqual({ a: { __oc__attributes: null, constructor: leaf('1'), toString: leaf('2') } });
	});

	it('names what it cannot take', () => {
		expect(errorOf('   ')).toEqual({ kind: 'empty' });
		expect(errorOf('<a><b></a>')).toEqual({ kind: 'invalid' });
		expect(errorOf('<a>x & y</a>')).toEqual({ kind: 'invalid' });
		expect(errorOf('<a/><b/>')).toEqual({ kind: 'multipleRoots' });
		expect(errorOf('<a>text<b/></a>')).toEqual({ kind: 'mixedContent' });
		expect(errorOf('<a><b>1</b><c/><b>2</b></a>')).toEqual({ kind: 'interleaved' });
	});

	it('refuses element names the stored format or JavaScript gives a meaning', () => {
		for (const name of ['__oc__value', '__oc__attributes', '_text', '_attributes', '_declaration', '_comment', '__proto__']) {
			expect(errorOf(`<a><${name}>1</${name}></a>`)).toEqual({ kind: 'reservedName', name });
		}
		expect(errorOf('<_declaration>1</_declaration>')).toEqual({ kind: 'reservedName', name: '_declaration' });
	});

	it('refuses a body nested deeper than the limit instead of overflowing the stack', () => {
		const deep = (levels: number) => `${'<a>'.repeat(levels)}x${'</a>'.repeat(levels)}`;
		expect(parseXmlBody(deep(XML_MAX_DEPTH)).ok).toBe(true);
		expect(errorOf(deep(XML_MAX_DEPTH + 1))).toEqual({ kind: 'tooDeep' });
		expect(errorOf(deep(5000))).toEqual({ kind: 'tooDeep' });
	});

	it('accepts an element that happens to be named parsererror', () => {
		expect(fieldsOf('<a><parsererror>1</parsererror></a>')).toEqual({ a: { __oc__attributes: null, parsererror: leaf('1') } });
	});
});

describe('checkXmlName', () => {
	it('tells valid, invalid and reserved element names apart', () => {
		expect(checkXmlName('soap:Body')).toBe('valid');
		expect(checkXmlName('Straße_1')).toBe('valid');
		expect(checkXmlName('a b')).toBe('invalid');
		expect(checkXmlName('1a')).toBe('invalid');
		expect(checkXmlName('_text')).toBe('reserved');
	});
});

describe('serializeXmlBody', () => {
	it('writes the fields back as indented XML that parses to the same fields', () => {
		const xml = '<a q="say &quot;hi&quot;">\n  <b>x &lt; y &amp; z</b>\n  <b>2</b>\n  <c/>\n</a>';
		expect(serializeXmlBody(fieldsOf(xml))).toBe(xml);
	});

	it('shows text it cannot parse as it is, instead of failing', () => {
		expect(serializeXmlBody('<a><b></a>')).toBe('<a><b></a>');
	});

	it('reads bodies older versions stored', () => {
		expect(serializeXmlBody({ _declaration: { _attributes: { version: '1.0' } }, a: { __oc__value: '1' } })).toBe('<a>1</a>');
		expect(serializeXmlBody({ a: { _attributes: { id: '1' }, _text: 'x' } })).toBe('<a id="1">x</a>');
		expect(serializeXmlBody({ a: { b: 'x', n: 5, c: null } })).toBe('<a>\n  <b>x</b>\n  <n>5</n>\n  <c/>\n</a>');
	});
});

describe('the XML editor tree', () => {
	it('drops a stored declaration when the body is written back', () => {
		const tree = createTreeFromCompactXml({ _declaration: { _attributes: { version: '1.0' } }, a: { __oc__value: '1' } });
		expect(serializeCompactXml(tree)).toEqual({ a: leaf('1') });
	});

	it('keeps primitive child values and writes empty elements with an empty text', () => {
		const tree = createTreeFromCompactXml({ a: { b: 'x', n: 5, c: { __oc__value: null } } });
		expect(serializeCompactXml(tree)).toEqual({ a: { __oc__attributes: null, b: leaf('x'), n: leaf('5'), c: leaf('') } });
	});

	it('reads legacy keys only when they hold what they stand for', () => {
		const tree = createTreeFromCompactXml({ a: { _attributes: { id: '1' }, _text: 'x' } });
		expect(tree).toMatchObject({ name: 'a', text: 'x', attributes: { id: '1' }, children: [] });
	});

	it('keeps an element named like a member of a JavaScript object a single element', () => {
		const tree = createTreeFromCompactXml({ a: { constructor: { __oc__value: '1' } } });
		expect(serializeCompactXml(tree)).toEqual({ a: { __oc__attributes: null, constructor: leaf('1') } });
	});

	it('agrees with the raw XML for every body the parser accepts', () => {
		for (const xml of ['<a><b>1</b><b>2</b><c/></a>', '<ns:a xmlns:ns="urn:x"><ns:b>v</ns:b></ns:a>', '<a id="1">t</a>']) {
			const fields = fieldsOf(xml);
			expect(serializeCompactXml(createTreeFromCompactXml(fields))).toEqual(fields);
		}
	});
});
