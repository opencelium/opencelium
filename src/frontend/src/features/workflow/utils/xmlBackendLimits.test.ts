import { describe, expect, it } from 'vitest';
import { findXmlBackendLimits } from './xmlBackendLimits';
import { parseXmlBody } from './xmlBody';

const limitsOf = (xml: string) => {
	const parsed = parseXmlBody(xml);
	if (!parsed.ok) throw new Error(parsed.error.kind);
	return findXmlBackendLimits(parsed.fields);
};

describe('findXmlBackendLimits', () => {
	it('finds nothing in a body the backend sends as shown', () => {
		expect(limitsOf('<a><b>1</b></a>')).toEqual({ attributes: [], prefixes: [] });
		expect(limitsOf('<m:Get xmlns:m="urn:m"><Id>5</Id></m:Get>')).toEqual({ attributes: [], prefixes: [] });
	});

	it('names elements with attributes other than one namespace declaration', () => {
		expect(limitsOf('<a id="1"><b x="1" y="2"/><c xmlns="urn:x"/></a>').attributes).toEqual(['a', 'b', 'c']);
		expect(limitsOf('<s:E xmlns:s="urn:s" xmlns:t="urn:t"/>').attributes).toEqual(['s:E']);
	});

	it('names prefixed elements that do not declare their prefix, and root prefixes with digits', () => {
		const soap = '<soap:Envelope xmlns:soap="urn:s"><soap:Body><m:Get xmlns:m="urn:m"><m:Id>5</m:Id></m:Get></soap:Body></soap:Envelope>';
		expect(limitsOf(soap).prefixes).toEqual(['soap:Body', 'm:Id']);
		expect(limitsOf('<s1:a xmlns:s1="urn:x"/>').prefixes).toEqual(['s1:a']);
	});
});
