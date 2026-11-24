import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildFromConnectorPayload } from './connectionPayload';
import { methodsToEntries } from './connectionMapper.entries';
import { toGlobalWrites, toRows } from '../components/global-writes/globalWrites.utils';

const writes = {
	'global.lastSync': '#FFCF00.(response).body.$.updatedAt',
	'global.lastId': '#FFCF00.(response).body.$.items[-1].id',
};
const nodes = [
	{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{ id: 'm1', type: 'connector', position: { x: 200, y: 0 }, data: { title: 'vCenter', subtitle: 'List VMs',
		kind: 'connector', color: '#FFCF00', globalWrites: writes } },
] as unknown as WorkflowNodeModel[];
const edges = [{ id: 'e1', type: 'workflow-edge', source: 'start', target: 'm1' }] as unknown as WorkflowEdgeModel[];

describe('method globalWrites', () => {
	it('is saved on the method, with no operator for it', () => {
		const { methods, operators } = buildFromConnectorPayload(nodes, edges);
		expect(methods[0].globalWrites).toEqual(writes);
		expect(operators).toEqual([]);
	});

	it('loads back onto the method node', () => {
		const { methods } = buildFromConnectorPayload(nodes, edges);
		const [entry] = methodsToEntries([{ ...methods[0] }], []);
		expect(entry.node.data.globalWrites).toEqual(writes);
	});

	it('is left out when the method writes nothing', () => {
		const plain = nodes.map((node) => ({ ...node, data: { ...node.data, globalWrites: undefined } })) as WorkflowNodeModel[];
		expect(buildFromConnectorPayload(plain, edges).methods[0]).not.toHaveProperty('globalWrites');
		expect(methodsToEntries([{ ...buildFromConnectorPayload(plain, edges).methods[0], globalWrites: {} }], [])[0]
			.node.data.globalWrites).toBeUndefined();
	});
});

describe('global write rows', () => {
	it('round-trip through the dialog rows, dropping unfinished ones', () => {
		const rows = toRows(writes);
		expect(rows.map(({ variable, value }) => [variable, value])).toEqual([
			['lastSync', writes['global.lastSync']],
			['lastId', writes['global.lastId']],
		]);
		expect(toGlobalWrites([...rows, { key: 'x', variable: 'count', value: '  ' }, { key: 'y', value: '5' }])).toEqual(writes);
	});

	it('keeps a constant as the text the backend parses', () => {
		expect(toGlobalWrites([{ key: 'a', variable: 'limits', value: ' {"max": 5} ' }])).toEqual({ 'global.limits': '{"max": 5}' });
	});
});
