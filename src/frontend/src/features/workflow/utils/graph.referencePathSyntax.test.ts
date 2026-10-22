import { describe, expect, it } from 'vitest';
import { JSONPathEnvironment } from 'json-p3';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { findInvalidReferencePaths } from './graph.referencePathSyntax';

const environment = new JSONPathEnvironment();

const method = (id: string, name: string, color: string, body: Record<string, unknown> = {}) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: name, kind: 'connector', color, methodConfig: { body } },
}) as unknown as WorkflowNodeModel;

const PROVIDER = '#3fa9f5';

describe('findInvalidReferencePaths', () => {
	it('flags the step holding a body reference whose path does not compile', () => {
		const nodes = [
			method('m1', 'GetUsers', PROVIDER),
			method('m2', 'CreateTicket', '#f5a623', {
				broken: `${PROVIDER}.(response).body.$.items b`,
				fine: `${PROVIDER}.(response).body.$.items[i].name`,
			}),
		];
		expect(findInvalidReferencePaths(environment, nodes, undefined)).toEqual([{
			nodeId: 'm2', step: { kind: 'named', name: 'CreateTicket' }, sourceName: 'GetUsers',
			direction: 'response', path: 'items b',
		}]);
	});

	it('names an unnamed operator by its kind, not by its condition expression', () => {
		const operator = {
			id: 'if1', type: 'if', position: { x: 0, y: 0 },
			data: { title: 'If', subtitle: `({%${PROVIDER}.(response).body.$.[0%} > '39')`, kind: 'if',
				conditionConfig: { expression: `({%${PROVIDER}.(response).body.$.[0%} > '39')` } },
		} as unknown as WorkflowNodeModel;
		const [invalid] = findInvalidReferencePaths(environment, [method('m1', 'GetUsers', PROVIDER), operator], undefined);
		expect(invalid).toMatchObject({ nodeId: 'if1', step: { kind: 'operator', operator: 'if' },
			sourceName: 'GetUsers', path: '[0' });
	});

	it('ignores headers, status and duplicates of the same reference', () => {
		const nodes = [
			method('m1', 'GetUsers', PROVIDER),
			method('m2', 'CreateTicket', '#f5a623', {
				header: `${PROVIDER}.(response).header.$.Content Type`,
				status: `${PROVIDER}.(response).status`,
				first: `${PROVIDER}.(response).body.$.a b`,
				second: `${PROVIDER}.(response).body.$.a b`,
			}),
		];
		expect(findInvalidReferencePaths(environment, nodes, undefined)).toHaveLength(1);
	});
});
