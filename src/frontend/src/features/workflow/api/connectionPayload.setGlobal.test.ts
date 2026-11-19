import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildFromConnectorPayload } from './connectionPayload';
import { methodsToEntries } from './connectionMapper.entries';

const nodes = [
	{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{ id: 'm1', type: 'connector', position: { x: 200, y: 0 }, data: { title: 'vCenter', subtitle: 'List VMs', kind: 'connector', color: '#FFCF00' } },
	{ id: 's1', type: 'setglobal', position: { x: 400, y: 0 }, data: { title: 'Set Variable', kind: 'setglobal',
		setGlobal: { variable: 'lastSync', value: '#FFCF00.(response).body.$.meta.lastModified' } } },
	{ id: 's2', type: 'setglobal', position: { x: 600, y: 0 }, data: { title: 'Set Variable', kind: 'setglobal',
		setGlobal: { variable: 'syncedVmCount', value: '5' } } },
] as unknown as WorkflowNodeModel[];
const edges = [
	{ id: 'e1', type: 'workflow-edge', source: 'start', target: 'm1' },
	{ id: 'e2', type: 'workflow-edge', source: 'm1', target: 's1' },
	{ id: 'e3', type: 'workflow-edge', source: 's1', target: 's2' },
] as unknown as WorkflowEdgeModel[];

describe('Set global variable step', () => {
	it('is saved in the operator list with its index', () => {
		const { operators, methods } = buildFromConnectorPayload(nodes, edges);
		expect(methods.map((method) => method.index)).toEqual(['0']);
		expect(operators).toEqual([
			{ id: 's1', index: '1', type: 'setglobal', setGlobal: { variable: 'lastSync', value: '#FFCF00.(response).body.$.meta.lastModified' } },
			{ id: 's2', index: '2', type: 'setglobal', setGlobal: { variable: 'syncedVmCount', value: 5 } },
		]);
	});

	it('loads back as a Set step with the value as editor text', () => {
		const entries = methodsToEntries([], [
			{ id: 's1', index: '1', type: 'setglobal', setGlobal: { variable: 'lastSync', value: '#FFCF00.(response).body.$.x' } },
			{ id: 's2', index: '2', type: 'setglobal', setGlobal: { variable: 'limits', value: { max: 5 } } },
		]);
		expect(entries.map((entry) => [entry.node.type, entry.node.data.setGlobal])).toEqual([
			['setglobal', { variable: 'lastSync', value: '#FFCF00.(response).body.$.x' }],
			['setglobal', { variable: 'limits', value: '{\n  "max": 5\n}' }],
		]);
	});
});

describe('aggregator publish', () => {
	it('is saved on the method and loaded back', () => {
		const published = nodes.map((node) => node.id === 'm1'
			? { ...node, data: { ...node.data, dataAggregator: 5, dataAggregatorPublish: { lastSyncOut: 'lastSync' } } }
			: node) as WorkflowNodeModel[];
		const { methods } = buildFromConnectorPayload(published, edges);
		expect(methods[0]).toMatchObject({ dataAggregator: 5, dataAggregatorPublish: { lastSyncOut: 'lastSync' } });
		const [entry] = methodsToEntries([{ ...methods[0] }], []);
		expect(entry.node.data.dataAggregatorPublish).toEqual({ lastSyncOut: 'lastSync' });
	});
});
