import { describe, expect, it } from 'vitest';
import { buildWorkflowIndexes } from './connectionPayload';
import { mapConnectionToWorkflowState } from './connectionMapper';
import { copyWorkflowNodeGroup } from '../utils/graph.dragDrop';

const rawMethod = (index: string, name: string, color: string, fields: Record<string, string> = {}) => ({
	index, name, color, label: null, methodType: 'CONNECTOR', dataAggregator: null,
	request: {
		endpoint: '{url}', method: 'POST', header: {},
		body: { type: 'object', format: 'json', data: 'raw', fields },
	},
	response: {
		success: { status: '200', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
		fail: { status: '500', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	},
	connector: { connectorId: 4, title: 'i-doit', invoker: 'i-doit' },
});

const M1_REFERENCE = '#C77E7E.(response).success.$.name';

// No saved `ui`, so the graph is rebuilt from the method tree alone.
const payload = {
	connectionId: 1, title: 'no ui', description: '',
	fromConnector: {
		connectorId: -1, title: 'DEFAULT', operators: [],
		methods: [
			rawMethod('0', 'M1', '#C77E7E'),
			rawMethod('1', 'M2', '#6477AB', { name: M1_REFERENCE }),
			rawMethod('2', 'M3', '#9EC798'),
		],
	},
	fieldBinding: [],
	ui: null,
};

describe('buildWorkflowEdges', () => {
	it('indexes every method of a workflow loaded without saved UI', () => {
		const { nodes, edges } = mapConnectionToWorkflowState(payload);
		expect([...buildWorkflowIndexes(nodes, edges).values()]).toEqual(['0', '1', '2']);
	});

	it('lets a copied pair keep its internal reference', () => {
		const state = mapConnectionToWorkflowState(payload);
		const idOf = (name: string) => state.nodes.find((node) => node.data.subtitle === name)!.id;
		const result = copyWorkflowNodeGroup({
			sourceNodeIds: [idOf('M1'), idOf('M2')],
			target: { nodeId: idOf('M3'), direction: 'right' },
			nodes: state.nodes, edges: state.edges, fieldBindings: state.fieldBindings,
		});
		const m1Copy = result.nodes.find((node) => node.id === result.idMap?.get(idOf('M1')));
		const m2Copy = result.nodes.find((node) => node.id === result.idMap?.get(idOf('M2')));
		expect(result.invalidReferences).toEqual([]);
		expect(m2Copy?.data.methodConfig?.body).toEqual({
			name: M1_REFERENCE.replace('#C77E7E', m1Copy?.data.color ?? ''),
		});
	});
});
