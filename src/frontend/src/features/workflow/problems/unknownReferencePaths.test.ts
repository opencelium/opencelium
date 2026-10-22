import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildBindingGraph } from '../lens/buildBindingGraph';
import { countUnknownReferencePaths } from './unknownReferencePaths';

const method = (id: string, color: string, data: Record<string, unknown> = {}) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color, ...data },
}) as unknown as WorkflowNodeModel;

const start = { id: 'start-1', type: 'start', position: { x: 0, y: 0 },
	data: { title: 'Start', kind: 'start' } } as unknown as WorkflowNodeModel;

const edge = (id: string, source: string, target: string) =>
	({ id, type: 'workflow-edge', source, target }) as unknown as WorkflowEdgeModel;

const declaredResponse = { success: { body: { type: 'object', fields: { id: '', items: [{ name: '' }] } } } };

const consumerReading = (...references: string[]) => method('m2', '#f5a623', {
	methodConfig: { url: '', headers: {}, queryParams: [], endpointArgs: {},
		bodyFormat: 'json', bodyData: 'json',
		body: Object.fromEntries(references.map((reference, index) => [`field${index}`, reference])) },
});

const count = (consumer: WorkflowNodeModel, providerData: Record<string, unknown> = { response: declaredResponse }) => {
	const nodes = [start, method('m1', '#3fa9f5', providerData), consumer];
	const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2')];
	return countUnknownReferencePaths(nodes, buildBindingGraph(nodes, edges, []));
};

describe('countUnknownReferencePaths', () => {
	it('counts references into fields the provider does not declare, per consumer', () => {
		expect(count(consumerReading(
			'#3fa9f5.(response).body.$.id',
			'#3fa9f5.(response).body.$.items[0].name',
			'#3fa9f5.(response).body.$.idd',
			'#3fa9f5.(response).body.$.items[0].title',
		))).toEqual(new Map([['m2', 2]]));
	});

	it('trusts a provider whose response declares nothing', () => {
		expect(count(consumerReading('#3fa9f5.(response).body.$.anything'), {})).toEqual(new Map());
	});

	it('leaves request-side, header and whole-body references alone', () => {
		expect(count(consumerReading(
			'#3fa9f5.(request).body.$.unknown',
			'#3fa9f5.(response).header.X-Unknown',
			'#3fa9f5.(response).body.$',
		))).toEqual(new Map());
	});
});
