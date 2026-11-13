import { describe, expect, it } from 'vitest';
import {
	buildStaticValues,
	findInvalidJsonInputKeys,
	findMissingInputKeys,
	inputKeyOfStaticReference,
	isWriteMethod,
	listStaticInputKeys,
	locateReference,
} from './methodTestRefs';
import type { MethodTestRefs, PlaygroundDraft } from './playground.types';
import { parseInputValue, readJsonError, toInputValue, type InputValue } from './playgroundValues';

const REFERENCE = '#aaaaaa.(response).body.$.id';

const refs: MethodTestRefs = {
	connectorReferences: [{ reference: '{token}', connectorId: 3, key: 'token', available: true }],
	staticReferences: [
		{ reference: `{%${REFERENCE}%}`, type: 'WRAPPED_DIRECT' },
		{ reference: REFERENCE, type: 'DIRECT' },
		{ reference: '${tag:int}', type: 'WEBHOOK' },
		{ reference: '@{offset}', type: 'PAGE' },
	],
};

const edited = (text: string, kind: InputValue['kind'] = 'json'): InputValue => ({ text, kind, source: 'edited' });

describe('inputKeyOfStaticReference', () => {
	it('shares one key between the wrapped and bare spelling of a reference', () => {
		expect(inputKeyOfStaticReference(`{% ${REFERENCE} %}`)).toBe(REFERENCE);
		expect(inputKeyOfStaticReference(REFERENCE)).toBe(REFERENCE);
	});

	it('keys a webhook variable by its name, with or without a type', () => {
		expect(inputKeyOfStaticReference('${tag:int}')).toBe('webhook:tag');
		expect(inputKeyOfStaticReference('${tag}')).toBe('webhook:tag');
	});

	it('keeps other references as written', () => {
		expect(inputKeyOfStaticReference('#{%65f1c2%}')).toBe('#{%65f1c2%}');
		expect(inputKeyOfStaticReference('@{offset}')).toBe('@{offset}');
	});
});

describe('buildStaticValues', () => {
	it('sends one parsed value per listed reference, keyed by the reference as written', () => {
		const staticValues = buildStaticValues({
			refs,
			values: { [REFERENCE]: edited('7'), 'webhook:tag': toInputValue('x', 'sample') },
			connectorOverrides: {},
		});
		expect(staticValues).toEqual({ [`{%${REFERENCE}%}`]: 7, [REFERENCE]: 7, '${tag:int}': 'x', '@{offset}': '' });
	});

	it('adds a connector reference only when the user typed over it', () => {
		expect(buildStaticValues({ refs, values: {}, connectorOverrides: { '{token}': 'test-token' } }))
			.toMatchObject({ '{token}': 'test-token' });
		expect(buildStaticValues({ refs, values: {}, connectorOverrides: {} })).not.toHaveProperty('{token}');
	});
});

describe('input checks', () => {
	const keys = listStaticInputKeys(refs);

	it('lists every value key once', () => {
		expect(keys).toEqual([REFERENCE, 'webhook:tag', '@{offset}']);
	});

	it('reports empty values as missing', () => {
		expect(findMissingInputKeys(keys, { [REFERENCE]: edited(' '), 'webhook:tag': edited('x') }))
			.toEqual([REFERENCE, '@{offset}']);
	});

	it('reports JSON that does not parse, but not text', () => {
		expect(findInvalidJsonInputKeys(keys, { [REFERENCE]: edited('{"a":'), 'webhook:tag': edited('{"a":', 'string') }))
			.toEqual([REFERENCE]);
	});

	it('parses JSON input and falls back to the raw text', () => {
		expect(parseInputValue({ text: '{"a":1}', kind: 'json' })).toEqual({ a: 1 });
		expect(parseInputValue({ text: 'not json', kind: 'json' })).toBe('not json');
		expect(parseInputValue(toInputValue('123', 'sample'))).toBe('123');
		expect(readJsonError({ text: '  ', kind: 'json' })).toBeNull();
	});
});

describe('request helpers', () => {
	it('asks for confirmation for everything but GET, HEAD and OPTIONS', () => {
		expect(['get', 'HEAD', 'OPTIONS'].map(isWriteMethod)).toEqual([false, false, false]);
		expect(['POST', 'put', 'DELETE', 'PATCH'].map(isWriteMethod)).toEqual([true, true, true, true]);
	});

	it('locates a reference in the URL, the headers or the body', () => {
		const draft = { request: { endpoint: '{url}/x', header: { Authorization: '{token}' }, body: null } } as unknown as PlaygroundDraft;
		expect(locateReference(draft, '{url}')).toBe('url');
		expect(locateReference(draft, '{token}')).toBe('header');
		expect(locateReference(draft, '@{offset}')).toBe('body');
	});
});
