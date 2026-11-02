import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { collectReferenceOccurrences } from './graph.referenceLocations';

const PROVIDER = '#7ed321';
const CONSUMER = '#f5a623';

const config = (overrides: Record<string, unknown> = {}) => ({
	url: '', headers: {}, queryParams: [], endpointArgs: {},
	bodyFormat: 'json', bodyData: 'json', body: {}, ...overrides,
});

const method = (id: string, color: string, methodConfig?: Record<string, unknown>) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color,
		methodConfig: methodConfig ?? config() },
}) as unknown as WorkflowNodeModel;

const read = `${PROVIDER}.(response).body.$.id`;

describe('collectReferenceOccurrences', () => {
	it('addresses a body field the way a reference to it would be written', () => {
		const nodes = [method('m1', CONSUMER, config({ body: { user: { ids: [read] } } }))];

		expect(collectReferenceOccurrences(nodes, undefined)).toEqual([{
			parsed: expect.objectContaining({ color: PROVIDER, path: 'id' }),
			consumerNodeId: 'm1',
			location: { kind: 'reference', value: `${CONSUMER}.(request).body.$.user.ids[0]` },
		}]);
	});

	it('addresses a header by its name', () => {
		const nodes = [method('m1', CONSUMER, config({ headers: { 'X-Id': read } }))];

		expect(collectReferenceOccurrences(nodes, undefined)[0].location)
			.toEqual({ kind: 'reference', value: `${CONSUMER}.(request).header.$.X-Id` });
	});

	// A value spliced into a URL has no field to name.
	it('includes the resolved URL and consuming method for a path argument', () => {
		const nodes = [method('m1', CONSUMER, config({
			url: 'https://x/#{%a1%}', endpointArgs: { a1: { id: 'a1', source: read } },
		}))];

		expect(collectReferenceOccurrences(nodes, undefined)[0].location)
			.toEqual({kind: 'label', value: `https://x/{%${read}%}`,
				url: {nodeId: 'm1', part: 'endpoint'}});
	});

	it('keeps the query parameter name and value for each usage', () => {
		const nodes = [method('m1', CONSUMER, config({queryParams: [
			{id: 'one', key: 'userId', value: read, enabled: true},
			{id: 'two', key: 'ownerId', value: read, enabled: true},
		]}))];
		expect(collectReferenceOccurrences(nodes, undefined).map((item) => item.location)).toEqual([
			{kind: 'label', value: `{%${read}%}`, url: {nodeId: 'm1', part: 'query', name: 'userId'}},
			{kind: 'label', value: `{%${read}%}`, url: {nodeId: 'm1', part: 'query', name: 'ownerId'}},
		]);
	});

	it('does not attribute unused endpoint arguments to the URL', () => {
		const nodes = [method('m1', CONSUMER, config({url: '/users',
			endpointArgs: {unused: {id: 'unused', source: read}}}))];
		expect(collectReferenceOccurrences(nodes, undefined)).toEqual([]);
	});

	// The enhancement says where it lands itself.
	it('takes an enhancement’s address from the field it fills', () => {
		const nodes = [method('m1', CONSUMER)];
		const fieldBindings = [{
			enhancement: { enhanceId: 'en-1', language: 'js', script: 'return VAR_0;',
				args: { VAR_0: read, RESULT_VAR: `${CONSUMER}.(request).body.$.total` } },
		}];

		expect(collectReferenceOccurrences(nodes, fieldBindings)).toEqual([{
			parsed: expect.objectContaining({ color: PROVIDER }),
			consumerNodeId: 'm1',
			location: { kind: 'reference', value: `${CONSUMER}.(request).body.$.total` },
		}]);
	});

	it('names an operator by its own label', () => {
		const operator = {
			id: 'if-1', type: 'if', position: { x: 0, y: 0 },
			data: { title: 'Only new ones', kind: 'if', conditionConfig: { operatorType: 'if',
				expression: `{%${read}%} = '1'`, tree: null } },
		} as unknown as WorkflowNodeModel;

		expect(collectReferenceOccurrences([operator], undefined)[0].location)
			.toEqual({ kind: 'operator', value: 'Only new ones', nodeId: 'if-1' });
	});
});
