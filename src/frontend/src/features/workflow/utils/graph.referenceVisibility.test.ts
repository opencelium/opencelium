import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { collectWorkflowJumpLinks, isWorkflowReferenceVisible } from './graph.referenceVisibility';

describe('isWorkflowReferenceVisible', () => {
	it('sees earlier methods in the same chain and on ancestor chains', () => {
		expect(isWorkflowReferenceVisible('0', '1')).toBe(true);
		expect(isWorkflowReferenceVisible('0', '1_0')).toBe(true);
		expect(isWorkflowReferenceVisible('1', '1_0')).toBe(true);
	});

	it('does not see later methods or methods in a sibling branch', () => {
		expect(isWorkflowReferenceVisible('2', '1')).toBe(false);
		expect(isWorkflowReferenceVisible('1_0', '2_0')).toBe(false);
	});

	it('lets a joint hand its own visibility to the target', () => {
		// 1_0 lives in a loop, 2 runs after it — normally invisible to each other.
		expect(isWorkflowReferenceVisible('1_0', '3')).toBe(false);
		const jumps = [{ from: '2', to: '3' }];
		// The joint 2 -> 3 gives 3 both method 2 and everything 2 already saw.
		expect(isWorkflowReferenceVisible('2', '3', jumps)).toBe(true);
		expect(isWorkflowReferenceVisible('0', '3', jumps)).toBe(true);
	});

	it('follows chained joints and passes the inherited visibility downstream', () => {
		const jumps = [{ from: '1_0', to: '2' }, { from: '2', to: '3' }];
		expect(isWorkflowReferenceVisible('1_0', '3', jumps)).toBe(true);
		// 4 runs after 3, so it inherits through 3 as well.
		expect(isWorkflowReferenceVisible('1_0', '4', jumps)).toBe(true);
	});

	it('does not hang on a joint cycle and still refuses an unreachable provider', () => {
		const jumps = [{ from: '2', to: '1' }, { from: '1', to: '2' }];
		expect(isWorkflowReferenceVisible('5_0', '2', jumps)).toBe(false);
	});
});

describe('collectWorkflowJumpLinks', () => {
	it('maps node joints into index space and skips unresolvable ones', () => {
		const nodes = [
			{ id: 'a', data: { jumpTo: 'b' } },
			{ id: 'b', data: {} },
			{ id: 'c', data: { jumpTo: 'gone' } },
		] as unknown as WorkflowNodeModel[];
		const indexes = new Map([['a', '0'], ['b', '2']]);
		expect(collectWorkflowJumpLinks(nodes, indexes)).toEqual([{ from: '0', to: '2' }]);
	});
});
