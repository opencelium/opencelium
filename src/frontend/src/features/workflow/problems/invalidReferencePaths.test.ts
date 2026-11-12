import { describe, expect, it } from 'vitest';
import { JSONPathEnvironment } from 'json-p3';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { countInvalidReferencePaths } from './invalidReferencePaths';

const environment = new JSONPathEnvironment();

const method = (id: string, color: string, body: Record<string, unknown> = {}) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color, methodConfig: { body } },
}) as unknown as WorkflowNodeModel;

const PROVIDER = '#3fa9f5';

describe('countInvalidReferencePaths', () => {
	it('counts the body references of a step whose path does not compile', () => {
		const nodes = [
			method('m1', PROVIDER),
			method('m2', '#f5a623', {
				broken: `${PROVIDER}.(response).body.$.items b`,
				alsoBroken: `${PROVIDER}.(response).body.$.[0`,
				fine: `${PROVIDER}.(response).body.$.items[i].name`,
			}),
		];
		expect(countInvalidReferencePaths(environment, nodes, undefined)).toEqual(new Map([['m2', 2]]));
	});

	it('flags an operator holding a broken reference in its condition', () => {
		const operator = {
			id: 'if1', type: 'if', position: { x: 0, y: 0 },
			data: { title: 'If', subtitle: '', kind: 'if',
				conditionConfig: { expression: `({%${PROVIDER}.(response).body.$.[0%} > '39')` } },
		} as unknown as WorkflowNodeModel;
		expect(countInvalidReferencePaths(environment, [method('m1', PROVIDER), operator], undefined))
			.toEqual(new Map([['if1', 1]]));
	});

	it('ignores headers, status and duplicates of the same reference', () => {
		const nodes = [
			method('m1', PROVIDER),
			method('m2', '#f5a623', {
				header: `${PROVIDER}.(response).header.$.Content Type`,
				status: `${PROVIDER}.(response).status`,
				first: `${PROVIDER}.(response).body.$.a b`,
				second: `${PROVIDER}.(response).body.$.a b`,
			}),
		];
		expect(countInvalidReferencePaths(environment, nodes, undefined)).toEqual(new Map([['m2', 1]]));
	});

	it('reports nothing before json-p3 has loaded', () => {
		const nodes = [method('m1', PROVIDER), method('m2', '#f5a623', { broken: `${PROVIDER}.(response).body.$.a b` })];
		expect(countInvalidReferencePaths(null, nodes, undefined).size).toBe(0);
	});
});
