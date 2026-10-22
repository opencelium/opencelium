import { describe, expect, it } from 'vitest';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { PlaygroundDraft } from './playground.types';
import {
	applyRequestEdits,
	createEmptyRow,
	headerRowsOf,
	isAddedRow,
	paramRowsOf,
	readRowOrigin,
} from './requestEdits';
import { buildCurl, connectionFieldSubstitution, referenceSubstitution, resolveRequest } from './resolveRequest';

const config = {
	url: 'https://api.test/items?page=1&owner=#{%arg1%}',
	method: 'GET',
	headers: { Accept: 'application/json', Authorization: 'Bearer {token}' },
	queryParams: [],
	endpointArgs: {},
	bodyFormat: 'json',
	bodyData: 'raw',
	body: { a: 1 },
} as unknown as WorkflowMethodConfig;

describe('readRowOrigin', () => {
	const fields = ['token', 'url'];
	it('tells fixed, dynamic, connection, secret and editable values apart', () => {
		expect(readRowOrigin({ key: 'Accept', value: 'application/json' }, fields, { Accept: 'application/json' })).toBe('fixed');
		expect(readRowOrigin({ key: 'Accept', value: 'text/plain' }, fields, { Accept: 'application/json' })).toBe('editable');
		expect(readRowOrigin({ key: 'owner', value: '#{%arg1%}' }, fields)).toBe('dynamic');
		expect(readRowOrigin({ key: 'X', value: '#aaaaaa.(response).body.$.id' }, fields)).toBe('dynamic');
		expect(readRowOrigin({ key: 'Host', value: '{url}' }, fields)).toBe('connection');
		expect(readRowOrigin({ key: 'Authorization', value: 'Bearer {token}' }, fields)).toBe('secret');
	});
});

describe('applyRequestEdits', () => {
	it('keeps the step as configured without edits', () => {
		expect(applyRequestEdits(config, {})).toEqual(config);
	});

	it('drops disabled headers and rebuilds the URL from the enabled parameters', () => {
		const headerRows = headerRowsOf(config).map((row) => row.key === 'Accept' ? { ...row, enabled: false } : row);
		const paramRows = [...paramRowsOf(config).filter((row) => row.key !== 'page'),
			{ ...createEmptyRow(), key: 'debug', value: 'true' }];
		const edited = applyRequestEdits(config, { method: 'POST', headerRows, paramRows, body: { b: 2 } });
		expect(edited.method).toBe('POST');
		expect(edited.headers).toEqual({ Authorization: 'Bearer {token}' });
		expect(edited.url).toBe('https://api.test/items?owner=#{%arg1%}&debug=true');
		expect(edited.body).toEqual({ b: 2 });
	});

	it('marks only the rows added in the playground', () => {
		expect(isAddedRow(createEmptyRow())).toBe(true);
		expect(headerRowsOf(config).some(isAddedRow)).toBe(false);
	});
});

describe('resolveRequest and buildCurl', () => {
	const draft = {
		request: {
			endpoint: '{url}/users/{%#aaaaaa.(response).body.$.id%}',
			method: 'put',
			header: { 'X-Id': '#aaaaaa.(response).body.$.id' },
			body: { fields: { id: '#aaaaaa.(response).body.$.id', note: "it's" } },
		},
	} as unknown as PlaygroundDraft;

	it('fills in values and builds a copyable command', () => {
		const sent = resolveRequest(draft, [
			referenceSubstitution('#aaaaaa.(response).body.$.id', 7),
			connectionFieldSubstitution('url', 'https://api.test'),
		]);
		expect(sent).toEqual({
			url: 'https://api.test/users/7', method: 'put', headers: { 'X-Id': 7 }, body: { id: 7, note: "it's" },
		});
		expect(buildCurl(sent)).toBe([
			"curl -X PUT 'https://api.test/users/7'",
			"  -H 'X-Id: 7'",
			`  -d '{"id":7,"note":"it'\\''s"}'`,
		].join(' \\\n'));
	});
});
