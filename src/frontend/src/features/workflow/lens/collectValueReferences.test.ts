import { describe, expect, it } from 'vitest';
import type { WorkflowMethodConfig } from '../types/request-config.types';
import { collectValueReferences } from './collectValueReferences';

const config = (overrides: Partial<WorkflowMethodConfig> = {}): WorkflowMethodConfig => ({
	url: '',
	headers: {},
	queryParams: [],
	endpointArgs: {},
	bodyFormat: 'json',
	bodyData: 'json' as WorkflowMethodConfig['bodyData'],
	body: {},
	...overrides,
});

describe('collectValueReferences', () => {
	it('finds a reference nested in the body, pathed as an enhancement would path it', () => {
		const { targets } = collectValueReferences(config({
			body: { user: { id: '#3fa9f5.(response).body.$.id' } },
		}));
		expect(targets).toEqual([{
			messageProperty: 'body',
			path: 'body.$.user.id',
			field: 'user.id',
			reference: '#3fa9f5.(response).body.$.id',
		}]);
	});

	it('indexes an array element the way the body editor writes it', () => {
		const { targets } = collectValueReferences(config({
			body: { items: [{ name: '#3fa9f5.(response).body.$.title' }] },
		}));
		expect(targets[0].path).toBe('body.$.items.[0].name');
	});

	it('finds a header reference and one embedded in a longer value', () => {
		const { targets } = collectValueReferences(config({
			headers: { Authorization: 'Bearer #3fa9f5.(response).body.$.token' },
			body: {},
		}));
		expect(targets).toEqual([{
			messageProperty: 'header',
			path: 'header.$.Authorization',
			field: 'Authorization',
			reference: '#3fa9f5.(response).body.$.token',
		}]);
	});

	it('splits several references sharing one field', () => {
		const { targets } = collectValueReferences(config({
			body: { note: '#3fa9f5.(response).body.$.a;#f5a623.(response).body.$.b' },
		}));
		expect(targets.map((target) => target.reference)).toEqual([
			'#3fa9f5.(response).body.$.a', '#f5a623.(response).body.$.b',
		]);
		expect(new Set(targets.map((target) => target.path))).toEqual(new Set(['body.$.note']));
	});

	it('describes a body that is one whole reference as the message itself', () => {
		const { targets } = collectValueReferences(config({
			body: '#3fa9f5.(response).body.$',
		}));
		expect(targets[0]).toMatchObject({ path: 'body.$', field: '' });
	});

	it('counts url, query and endpoint references as out of scope instead of listing them', () => {
		const { targets, outsideScope } = collectValueReferences(config({
			url: 'https://api.test/{id}',
			endpointArgs: { id: { id: 'id', source: '#3fa9f5.(response).body.$.id' } },
			queryParams: [{ id: 'q1', key: 'since', value: '#3fa9f5.(response).body.$.date',
				enabled: true }],
		}));
		expect(targets).toEqual([]);
		expect(outsideScope).toBe(2);
	});

	it('ignores a value with no reference in it, and a method with no config', () => {
		expect(collectValueReferences(config({ body: { name: 'plain' } })).targets).toEqual([]);
		expect(collectValueReferences(undefined).targets).toEqual([]);
	});
});
