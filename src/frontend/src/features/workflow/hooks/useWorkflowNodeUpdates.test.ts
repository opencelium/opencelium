import { describe, expect, it, vi } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
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
		const { onSaveConditionConfig } = useWorkflowNodeUpdates(setNodes, vi.fn(), vi.fn(), vi.fn());
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
		const { onSaveConditionConfig } = useWorkflowNodeUpdates(setNodes, vi.fn(), vi.fn(), vi.fn());
		const nodes = [loopNode({ subtitle: 'My custom label', labelEdited: true, kind: 'loop' })];

		onSaveConditionConfig('loop-1', {
			operatorType: 'loop', tree: { id: 'g', type: 'group', properties: {}, items: [] },
			expression: 'for {%#6477AB.(response).body.$.[*]%}', iterator: 'i',
		} as any);

		const [result] = applyUpdater(nodes, setNodes);
		expect(result.data.subtitle).toBe('My custom label');
	});
});
