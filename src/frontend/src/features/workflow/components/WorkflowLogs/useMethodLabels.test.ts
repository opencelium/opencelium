import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { buildFromConnectorPayload } from '../../api/connectionPayload';
import { buildMethodLabels } from './useMethodLabels';

const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{
		id: 'method-renamed', type: 'connector', position: { x: 240, y: 0 },
		data: { title: 'C', subtitle: 'Fetch every user', kind: 'connector', labelEdited: true,
			methodConfig: { name: 'getAllUser' } },
	},
	{
		id: 'method-plain', type: 'connector', position: { x: 480, y: 0 },
		data: { title: 'C', subtitle: 'createUser', kind: 'connector',
			methodConfig: { name: 'createUser' } },
	},
] as unknown as WorkflowNodeModel[];

const edges = [
	{ id: 'e1', type: 'workflow-edge', source: 'start-1', target: 'method-renamed' },
	{ id: 'e2', type: 'workflow-edge', source: 'method-renamed', target: 'method-plain' },
] as unknown as WorkflowEdgeModel[];

describe('buildMethodLabels', () => {
	it('keys a renamed step by the index the log will report it under', () => {
		// The log's indexPath is the method index the payload was built with, so the
		// two have to agree for a row to find its label at all.
		const sentIndexes = Object.fromEntries(buildFromConnectorPayload(nodes, edges)
			.methods.map((method) => [method.id, method.index]));
		expect(sentIndexes).toEqual({ 'method-renamed': '0', 'method-plain': '1' });

		expect(buildMethodLabels(nodes, edges).get(sentIndexes['method-renamed']))
			.toBe('Fetch every user');
	});

	it('leaves an un-renamed step unlabelled, so its row keeps showing the method name', () => {
		expect(buildMethodLabels(nodes, edges).has('1')).toBe(false);
	});

	it('ignores a label that is only whitespace', () => {
		const blank = nodes.map((node) => node.id === 'method-renamed'
			? { ...node, data: { ...node.data, subtitle: '   ' } }
			: node) as WorkflowNodeModel[];
		expect(buildMethodLabels(blank, edges).has('0')).toBe(false);
	});
});
