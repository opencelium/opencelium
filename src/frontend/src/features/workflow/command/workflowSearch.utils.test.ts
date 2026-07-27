import { describe, expect, it } from 'vitest';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../types/workflow.types';
import { searchWorkflowNodes } from './workflowSearch.utils';

const methodNode = (id: string, name: string, overrides: Partial<WorkflowNodeData['methodConfig']> = {}): Node<WorkflowNodeData> => ({
	id,
	type: 'connector',
	position: { x: 0, y: 0 },
	data: {
		title: 'DEFAULT',
		subtitle: name,
		kind: 'connector',
		methodConfig: {
			name,
			url: 'https://your-domain.com',
			method: 'POST',
			headers: {},
			queryParams: [],
			endpointArgs: {},
			bodyFormat: 'json',
			bodyData: 'raw',
			body: {},
			...overrides,
		},
	},
});

const operatorNode = (id: string, type: 'if' | 'loop', expression: string): Node<WorkflowNodeData> => ({
	id,
	type,
	position: { x: 0, y: 0 },
	data: {
		title: type === 'loop' ? 'Loop' : 'If',
		subtitle: expression,
		kind: type,
		conditionConfig: { operatorType: type, tree: { id: '0-group', type: 'group', properties: { not: false }, items: [] }, expression },
	},
});

describe('searchWorkflowNodes', () => {
	it('matches methods by name, tolerating a small typo', () => {
		const nodes = [methodNode('a', 'ConfigItemCreate'), methodNode('b', 'ConfigItemGet')];
		const matches = searchWorkflowNodes(nodes, 'ConfigItemCreat');
		expect(matches.map((match) => match.node.id)).toContain('a');
	});

	it('matches on request URL content', () => {
		const nodes = [
			methodNode('a', 'A', { url: 'https://api.znuny-instance.example.com/webservice' }),
			methodNode('b', 'B', { url: 'https://otrs.example.com' }),
		];
		const matches = searchWorkflowNodes(nodes, 'znuny-instance');
		expect(matches.map((match) => match.node.id)).toEqual(['a']);
	});

	it('matches on header values', () => {
		const nodes = [
			methodNode('a', 'A', { headers: { Authorization: 'Bearer secret-token-xyz' } }),
			methodNode('b', 'B', { headers: {} }),
		];
		const matches = searchWorkflowNodes(nodes, 'secret-token-xyz');
		expect(matches.map((match) => match.node.id)).toEqual(['a']);
	});

	it('matches on request body field values', () => {
		const nodes = [
			methodNode('a', 'A', { body: { params: { category: 'C__CATG__LOCATION' } } }),
			methodNode('b', 'B', { body: {} }),
		];
		const matches = searchWorkflowNodes(nodes, 'C__CATG__LOCATION');
		expect(matches.map((match) => match.node.id)).toEqual(['a']);
	});

	it('matches on response body field values', () => {
		const nodes = [
			methodNode('a', 'A', {
				response: {
					responseId: 'response-a',
					success: { status: '200', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: { hostname: 'i-doit-primary' } } },
					fail: { status: '500', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
				},
			}),
			methodNode('b', 'B'),
		];
		const matches = searchWorkflowNodes(nodes, 'i-doit-primary');
		expect(matches.map((match) => match.node.id)).toEqual(['a']);
	});

	it('matches if/loop operators by condition expression', () => {
		const nodes = [
			operatorNode('if-1', 'if', '{%#6477AB.(response).body.$.ConfigItemIDs[]%} NotEmpty'),
			operatorNode('if-2', 'if', '{%#6477AB.(response).body.$.ConfigItemIDs[]%} IsEmpty'),
		];
		const matches = searchWorkflowNodes(nodes, 'NotEmpty');
		expect(matches.map((match) => match.node.id)).toEqual(['if-1']);
	});

	it('returns nothing for an unrelated term', () => {
		const nodes = [methodNode('a', 'ConfigItemCreate')];
		expect(searchWorkflowNodes(nodes, 'completely-unrelated-zzz')).toEqual([]);
	});

	it('returns nothing for an empty term', () => {
		const nodes = [methodNode('a', 'ConfigItemCreate')];
		expect(searchWorkflowNodes(nodes, '   ')).toEqual([]);
	});
});
