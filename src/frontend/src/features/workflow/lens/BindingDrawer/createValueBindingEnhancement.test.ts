import { describe, expect, it } from 'vitest';
import { findRequestEnhancement } from '../../components/request-editor/body-editor/bodyBindingLookup';
import type { Connection } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { buildBindingGraph } from '../buildBindingGraph';
import { createValueBindingEnhancement } from './createValueBindingEnhancement';

const method = (id: string, color: string, body: unknown = {}) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color,
		methodConfig: { url: '', headers: {}, queryParams: [], endpointArgs: {},
			bodyFormat: 'json', bodyData: 'json', body } },
}) as unknown as WorkflowNodeModel;

const nodes = [
	method('provider', '#3F8AB4'),
	method('consumer', '#C77E7E', {
		user: { id: '#3F8AB4.(response).body.$.id', note: 'Bearer #3F8AB4.(response).body.$.token' },
	}),
];
const edges = [{ id: 'e1', type: 'workflow-edge', source: 'provider', target: 'consumer' }] as
	unknown as WorkflowEdgeModel[];

const valueBinding = (path: string) => {
	const binding = buildBindingGraph(nodes, edges, []).bindings
		.find((item) => item.consumer.path === path);
	if (!binding) throw new Error(`no binding on ${path}`);
	return binding;
};

describe('createValueBindingEnhancement', () => {
	it('creates an enhancement the body editor finds for the same field', () => {
		const created = createValueBindingEnhancement(valueBinding('body.$.user.id'), nodes, []);
		expect(created).not.toBeNull();
		const connection = { fieldBindings: created?.fieldBindings } as unknown as Connection;
		const found = findRequestEnhancement(connection, '#C77E7E', ['user'], 'id', 'body',
			'#3F8AB4.(response).body.$.id');
		expect(found?.args).toMatchObject({
			RESULT_VAR: '#C77E7E.(request).body.$.user.id',
			VAR_0: '#3F8AB4.(response).body.$.id',
		});
		expect(created?.bindingKey).toBe(`${found?.enhanceId}:VAR_0`);
	});

	it('refuses a value with text around its reference', () => {
		expect(createValueBindingEnhancement(valueBinding('body.$.user.note'), nodes, [])).toBeNull();
	});
});
