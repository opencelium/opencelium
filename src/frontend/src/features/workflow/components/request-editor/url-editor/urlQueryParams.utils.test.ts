import { describe, expect, it } from 'vitest';
import {
	buildQueryFromParams,
	buildQueryParamsFromEndpoint,
	encodeQueryKey,
	encodeQueryValue,
	splitEndpoint,
	stripMockActiveFromEndpoint,
	type QueryParamLite,
} from './urlQueryParams.utils';
import { sanitizeUrlInputValue } from './urlEditor.utils';

// What the editor saves after reading an endpoint into rows and writing them back.
const roundTrip = (endpoint: string, autoEncode = true) => {
	const rows = buildQueryParamsFromEndpoint<QueryParamLite>(endpoint, [], false)
		.map((row) => ({ ...row, autoEncode }));
	const { base } = splitEndpoint(endpoint);
	const query = buildQueryFromParams(rows, true);
	return query ? `${base}?${query}` : base;
};

describe('endpoint round trip keeps the URL as written', () => {
	it.each([
		'{url}/my folder/Müller?q=my folder',
		'{url}/my%20folder?q=my%20folder',
		'{url}/files?q=a%26b',
		'{url}/files?q=a%2Bb',
		'{url}/files?q=a+b',
		'{url}/files?q=100%',
		'{url}/files?q=%2520',
		'{url}/files?id=1&x=2&id=3',
		'{url}/files?q=&pretty',
		'{url}/files?filter[age]=5&filter[name]=x',
		'{url}/files?ids=${ids:array}&p=@{offset}&t={token}&k={#12.apiKey}',
		'{url}/items?#{%arg1%}',
		'{url}/items?name=#{%arg1%}&x=1',
		'#{%arg1%}/next',
	])('%s', (endpoint) => {
		expect(roundTrip(endpoint)).toBe(endpoint);
		expect(roundTrip(endpoint, false)).toBe(endpoint);
	});
});

describe('rows', () => {
	it('show the query text as written, without decoding it', () => {
		const rows = buildQueryParamsFromEndpoint<QueryParamLite>('/x?q=a%26b&pretty', [], false);
		expect(rows.map(({ key, value, isFlag }) => ({ key, value, isFlag })))
			.toEqual([{ key: 'q', value: 'a%26b', isFlag: undefined }, { key: 'pretty', value: '', isFlag: true }]);
	});

	it('write a flag with a value as a normal parameter', () => {
		expect(buildQueryFromParams([{ id: '1', key: 'pretty', value: '1', enabled: true, isFlag: true }], true))
			.toBe('pretty=1');
	});
});

describe('Encode before sending', () => {
	it('escapes only what would split the row into other query parts', () => {
		expect(encodeQueryValue('Tom & Jerry #1 a+b 100% Müller')).toBe('Tom %26 Jerry %231 a+b 100% Müller');
		expect(encodeQueryKey('a=b&c#d')).toBe('a%3Db%26c%23d');
	});

	it('never touches references', () => {
		const value = '#{%arg1%}&{%#abc123.(response).body.$.a%}&${name}&@{page}&{token}&{#12.apiKey}';
		expect(encodeQueryValue(value))
			.toBe('#{%arg1%}%26{%#abc123.(response).body.$.a%}%26${name}%26@{page}%26{token}%26{#12.apiKey}');
	});

	it('is skipped for a row sent as entered', () => {
		expect(buildQueryFromParams([{ id: '1', key: 'q', value: 'a&b', enabled: true, autoEncode: false }], true))
			.toBe('q=a&b');
		expect(buildQueryFromParams([{ id: '1', key: 'q', value: 'a&b', enabled: true }], true)).toBe('q=a%26b');
	});
});

describe('URL input', () => {
	it('accepts every printable character but < and >', () => {
		expect(sanitizeUrlInputValue('filter[a]|x^y`z\\ü<b>\t')).toBe('filter[a]|x^y`z\\üb');
	});

	it('keeps flags when removing the mock parameter', () => {
		expect(stripMockActiveFromEndpoint('/x?mock=active&pretty&q=')).toBe('/x?pretty&q=');
	});
});
