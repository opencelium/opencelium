import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { applyProblemFocus } from './applyProblemFocus';

const node = (id: string) => ({ id, position: { x: 0, y: 0 }, data: { title: id } }) as unknown as WorkflowNodeModel;

describe('applyProblemFocus', () => {
	const nodes = [node('a'), node('b')];

	it('rings only the focused node and keeps every other node as it was', () => {
		const focused = applyProblemFocus(nodes, 'b', 'warning');
		expect(focused[0]).toBe(nodes[0]);
		expect(focused[1].data.problemFocus).toBe('warning');
		expect(nodes[1].data.problemFocus).toBeUndefined();
	});

	// A focused step whose problems were fixed has no tone left to ring it with.
	it('returns the same list when nothing is focused or the problem is gone', () => {
		expect(applyProblemFocus(nodes, null, 'danger')).toBe(nodes);
		expect(applyProblemFocus(nodes, 'b', null)).toBe(nodes);
	});
});
