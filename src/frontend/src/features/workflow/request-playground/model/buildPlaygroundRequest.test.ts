import { describe, expect, it } from 'vitest';
import {
	buildPlaygroundRequest,
	findInvalidJsonInputKeys,
	findMissingInputKeys,
	selectMethodFieldBindings,
} from './buildPlaygroundRequest';
import type { PlaygroundInputs } from './collectPlaygroundInputs';
import type { PlaygroundDraft } from './playground.types';
import { defaultSettings } from './playgroundSettings';
import { parseInputValue, readJsonError, toInputValue, type InputValue } from './playgroundValues';

const binding = (resultVar: string) => ({
	enhancement: { enhanceId: 'e1', language: 'js', script: 'RESULT_VAR = VAR_0', args: { VAR_0: '#aaaaaa.(response).body.$.id', RESULT_VAR: resultVar } },
});

const REFERENCE = '#aaaaaa.(response).body.$.id';

const inputs = {
	references: [{ reference: REFERENCE, targets: [{ location: 'url', property: null }] }],
	webhooks: [{ name: 'tag', type: 'string', targets: [{ location: 'body', property: 'tag' }] }],
	connectionFields: [],
} as unknown as PlaygroundInputs;

const draft = { color: '#bbbbbb', request: { method: 'GET' } } as unknown as PlaygroundDraft;

const edited = (text: string, kind: InputValue['kind'] = 'json'): InputValue => ({ text, kind, source: 'edited' });

describe('selectMethodFieldBindings', () => {
	it('keeps only the bindings that write into this method’s request', () => {
		const selected = selectMethodFieldBindings([
			binding('#BBBBBB.(request).body.$.id'),
			binding('#cccccc.(request).body.$.id'),
		], '#bbbbbb');
		expect(selected).toHaveLength(1);
		expect(selected[0]).toMatchObject({ to: [{ color: '#BBBBBB', type: 'request' }] });
	});
});

describe('input values', () => {
	it('keeps a string sample a string even when it looks like a number', () => {
		expect(parseInputValue(toInputValue('123', 'sample'))).toBe('123');
	});

	it('parses JSON input and falls back to the raw text', () => {
		expect(parseInputValue({ text: '{"a":1}', kind: 'json' })).toEqual({ a: 1 });
		expect(parseInputValue({ text: '42', kind: 'json' })).toBe(42);
		expect(parseInputValue({ text: 'not json', kind: 'json' })).toBe('not json');
	});

	it('reports JSON that does not parse, but not text, empty or valid JSON', () => {
		expect(readJsonError({ text: '{"a": 1,}', kind: 'json' })).toEqual(expect.any(String));
		expect(readJsonError({ text: '{"a": 1,}', kind: 'string' })).toBeNull();
		expect(readJsonError({ text: '  ', kind: 'json' })).toBeNull();
		expect(readJsonError({ text: '[1, 2]', kind: 'json' })).toBeNull();
	});
});

describe('buildPlaygroundRequest', () => {
	const build = (prefillSource: 'sample' | 'upstream', values: Record<string, InputValue>) => buildPlaygroundRequest({
		connectionId: 5, connectorId: 9, draft, fieldBindings: [], inputs, values, prefillSource,
		requestData: { url: 'https://staging' }, settings: defaultSettings(undefined),
	});

	it('sends every input with its parsed value and marks the typed ones', () => {
		const request = build('sample', {
			[REFERENCE]: edited('7'),
			'webhook:tag': toInputValue('x', 'sample'),
		});
		expect(request.references).toEqual([{ reference: REFERENCE, value: 7, isOverridden: true }]);
		expect(request.webhooks).toEqual([{ name: 'tag', value: 'x' }]);
		expect(request).toMatchObject({ connectionId: 5, connectorId: 9, runUpstream: false,
			requestData: { url: 'https://staging' } });
		expect(request.settings).not.toHaveProperty('saveResponseAsSample');
	});

	it('leaves references to a fresh upstream run unless the user typed one', () => {
		expect(build('upstream', {}).references).toEqual([]);
		expect(build('upstream', { [REFERENCE]: edited('8') }).references)
			.toEqual([{ reference: REFERENCE, value: 8, isOverridden: true }]);
		expect(build('upstream', {}).runUpstream).toBe(true);
	});

	it('reports empty inputs as missing, except when an upstream run provides them', () => {
		expect(findMissingInputKeys(inputs, { [REFERENCE]: edited(' ') }, 'sample')).toEqual([REFERENCE, 'webhook:tag']);
		expect(findMissingInputKeys(inputs, {}, 'upstream')).toEqual([]);
	});

	it('reports inputs whose JSON does not parse', () => {
		expect(findInvalidJsonInputKeys(inputs, {
			[REFERENCE]: edited('{"a":'),
			'webhook:tag': edited('{"a":', 'string'),
		})).toEqual([REFERENCE]);
	});
});
