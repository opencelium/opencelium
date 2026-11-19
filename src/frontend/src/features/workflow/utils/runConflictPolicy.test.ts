import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { buildConnectionPayload } from '../api/connectionPayload';
import { readRunConflictPolicy, withRunConflictPolicy } from './runConflictPolicy';

const nodes = [
	{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
] as unknown as WorkflowNodeModel[];

describe('run conflict policy', () => {
	it('lives on the start node and ignores anything but the two policies', () => {
		expect(readRunConflictPolicy(withRunConflictPolicy(nodes, 'REJECT'))).toBe('REJECT');
		expect(withRunConflictPolicy(nodes, 'SOMETHING')).toBe(nodes);
		expect(readRunConflictPolicy(nodes)).toBeUndefined();
	});

	it('is sent at the workflow root only once chosen', () => {
		const base = { title: 't', description: '', edges: [] };
		expect(buildConnectionPayload({ ...base, nodes })).not.toHaveProperty('runConflictPolicy');
		expect(buildConnectionPayload({ ...base, nodes: withRunConflictPolicy(nodes, 'QUEUE') }))
			.toMatchObject({ runConflictPolicy: 'QUEUE' });
	});
});
