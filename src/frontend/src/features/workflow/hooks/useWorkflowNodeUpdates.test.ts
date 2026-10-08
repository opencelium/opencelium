import { describe, expect, it, vi } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { Connector } from '@entities/connector/model/types';
import { useWorkflowNodeUpdates } from './useWorkflowNodeUpdates';

const loopNode = (data: Record<string, unknown>) => ({
	id: 'loop-1', type: 'loop', position: { x: 0, y: 0 }, data,
}) as unknown as WorkflowNodeModel;

const applyUpdater = (nodes: WorkflowNodeModel[], setNodes: ReturnType<typeof vi.fn>) => {
	const updater = setNodes.mock.calls[0][0];
	return updater(nodes);
};

describe('useWorkflowNodeUpdates.onSaveConditionConfig', () => {
	it('refreshes subtitle to the new expression when the node has no custom label', () => {
		const setNodes = vi.fn();
		const { onSaveConditionConfig } = useWorkflowNodeUpdates(setNodes, vi.fn(), vi.fn(), vi.fn(), vi.fn());
		const nodes = [loopNode({ subtitle: 'for {%#FFCFB5.(response).body.$.[*]%}', kind: 'loop' })];

		onSaveConditionConfig('loop-1', {
			operatorType: 'loop', tree: { id: 'g', type: 'group', properties: {}, items: [] },
			expression: 'for {%#6477AB.(response).body.$.[*]%}', iterator: 'i',
		} as any);

		const [result] = applyUpdater(nodes, setNodes);
		expect(result.data.subtitle).toBe('for {%#6477AB.(response).body.$.[*]%}');
	});

	it('leaves a user-given label alone', () => {
		const setNodes = vi.fn();
		const { onSaveConditionConfig } = useWorkflowNodeUpdates(setNodes, vi.fn(), vi.fn(), vi.fn(), vi.fn());
		const nodes = [loopNode({ subtitle: 'My custom label', labelEdited: true, kind: 'loop' })];

		onSaveConditionConfig('loop-1', {
			operatorType: 'loop', tree: { id: 'g', type: 'group', properties: {}, items: [] },
			expression: 'for {%#6477AB.(response).body.$.[*]%}', iterator: 'i',
		} as any);

		const [result] = applyUpdater(nodes, setNodes);
		expect(result.data.subtitle).toBe('My custom label');
	});
});

describe('useWorkflowNodeUpdates.onChangeNodeConnector', () => {
	it('reassigns only the given node and closes the connector editor', () => {
		const setNodes = vi.fn();
		const closeConnectorEditor = vi.fn();
		const { onChangeNodeConnector } = useWorkflowNodeUpdates(setNodes, vi.fn(), vi.fn(), vi.fn(), closeConnectorEditor);
		const methodNode = (id: string) => ({
			id, type: 'connector', position: { x: 0, y: 0 },
			data: { title: 'Old', subtitle: 'GetUser', kind: 'connector',
				connector: { connectorId: 1, title: 'Old', invokerName: 'i-doit' } },
		}) as unknown as WorkflowNodeModel;
		const nodes = [methodNode('a'), methodNode('b')];

		onChangeNodeConnector('a', {
			connectorId: 2, title: 'New', invoker: { name: 'i-doit' }, status: 'OK',
		} as unknown as Connector);

		const [changed, untouched] = applyUpdater(nodes, setNodes);
		expect(changed.data.connector).toMatchObject({ connectorId: 2, title: 'New', invokerName: 'i-doit' });
		expect(changed.data.subtitle).toBe('GetUser');
		expect(untouched.data.connector?.connectorId).toBe(1);
		expect(closeConnectorEditor).toHaveBeenCalledOnce();
	});
});
