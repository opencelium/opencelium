import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setSimulatedWorkflowGraph, useSimulatedWorkflowGraph,
	type SimulatedWorkflowGraph } from './simulatedWorkflowGraph';

const graph = (): SimulatedWorkflowGraph => ({ nodes: [], edges: [], fieldBindings: [] });

describe('useSimulatedWorkflowGraph', () => {
	afterEach(() => setSimulatedWorkflowGraph(null));

	it('applies a graph registered after the editor mounted, once', () => {
		const apply = vi.fn();
		const { rerender } = renderHook(() => useSimulatedWorkflowGraph(true, apply));
		expect(apply).not.toHaveBeenCalled();

		const seeded = graph();
		act(() => setSimulatedWorkflowGraph(seeded));
		rerender();
		rerender();

		expect(apply).toHaveBeenCalledOnce();
		expect(apply).toHaveBeenCalledWith(seeded);
	});

	it('applies one that was already registered when the editor mounts', () => {
		const seeded = graph();
		setSimulatedWorkflowGraph(seeded);
		const apply = vi.fn();
		renderHook(() => useSimulatedWorkflowGraph(true, apply));
		expect(apply).toHaveBeenCalledWith(seeded);
	});

	// A saved workflow's own graph must never be replaced by the tutorial's.
	it('leaves a saved workflow alone', () => {
		setSimulatedWorkflowGraph(graph());
		const apply = vi.fn();
		renderHook(() => useSimulatedWorkflowGraph(false, apply));
		expect(apply).not.toHaveBeenCalled();
	});
});
