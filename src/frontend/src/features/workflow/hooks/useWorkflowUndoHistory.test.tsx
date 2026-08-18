import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { useWorkflowUndoHistory } from './useWorkflowUndoHistory';

const makeNode = (id: string, x = 0) => ({
	id, type: 'connector', position: { x, y: 0 },
	data: { title: id, kind: 'connector' },
}) as unknown as WorkflowNodeModel;

const startNodes = [makeNode('start-1')];

// Mirrors the page wiring: the hook observes graph state it does not own.
const useHarness = (isDragging = false) => {
	const [nodes, setNodes] = useState<WorkflowNodeModel[]>(startNodes);
	const [edges, setEdges] = useState<WorkflowEdgeModel[]>([]);
	const [fieldBindings, setFieldBindings] = useState<unknown[] | undefined>();
	const history = useWorkflowUndoHistory({ nodes, edges, fieldBindings, isDragging,
		setNodes, setEdges, onFieldBindingsChange: setFieldBindings });
	return { nodes, edges, fieldBindings, setNodes, setEdges, setFieldBindings, history };
};

const settle = () => act(() => { vi.advanceTimersByTime(500); });

describe('useWorkflowUndoHistory', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('starts with nothing to undo or redo', () => {
		const { result } = renderHook(() => useHarness());
		settle();
		expect(result.current.history.canUndo).toBe(false);
		expect(result.current.history.canRedo).toBe(false);
	});

	it('undoes and redoes a node addition', () => {
		const { result } = renderHook(() => useHarness());
		settle();

		act(() => result.current.setNodes([...startNodes, makeNode('method-1', 240)]));
		settle();
		expect(result.current.history.canUndo).toBe(true);

		act(() => result.current.history.undo());
		expect(result.current.nodes.map((node) => node.id)).toEqual(['start-1']);
		expect(result.current.history.canRedo).toBe(true);

		act(() => result.current.history.redo());
		expect(result.current.nodes.map((node) => node.id)).toEqual(['start-1', 'method-1']);
		expect(result.current.history.canRedo).toBe(false);
	});

	it('coalesces a burst of mutations into one entry', () => {
		const { result } = renderHook(() => useHarness());
		settle();

		act(() => {
			result.current.setNodes([...startNodes, makeNode('method-1', 240)]);
			result.current.setEdges([{ id: 'e1', source: 'start-1', target: 'method-1' } as WorkflowEdgeModel]);
			result.current.setFieldBindings([{ id: 'binding-1' }]);
		});
		settle();

		act(() => result.current.history.undo());
		expect(result.current.nodes).toHaveLength(1);
		expect(result.current.edges).toHaveLength(0);
		expect(result.current.fieldBindings).toBeUndefined();
		expect(result.current.history.canUndo).toBe(false);
	});

	it('restores field bindings alongside the graph', () => {
		const { result } = renderHook(() => useHarness());
		settle();
		act(() => result.current.setFieldBindings([{ id: 'binding-1' }]));
		settle();

		act(() => result.current.history.undo());
		expect(result.current.fieldBindings).toBeUndefined();
		act(() => result.current.history.redo());
		expect(result.current.fieldBindings).toEqual([{ id: 'binding-1' }]);
	});

	it('ignores render-only churn such as selection', () => {
		const { result } = renderHook(() => useHarness());
		settle();
		act(() => result.current.setNodes(startNodes.map((node) =>
			({ ...node, selected: true, data: { ...node.data, highlighted: true } }))));
		settle();
		expect(result.current.history.canUndo).toBe(false);
	});

	it('records nothing while a drag is in flight', () => {
		const { result } = renderHook(() => useHarness(true));
		settle();
		act(() => result.current.setNodes([...startNodes, makeNode('method-1', 240)]));
		settle();
		expect(result.current.history.canUndo).toBe(false);
	});

	it('drops redo entries once a new edit lands', () => {
		const { result } = renderHook(() => useHarness());
		settle();
		act(() => result.current.setNodes([...startNodes, makeNode('method-1', 240)]));
		settle();
		act(() => result.current.history.undo());
		expect(result.current.history.canRedo).toBe(true);

		act(() => result.current.setNodes([...startNodes, makeNode('method-2', 480)]));
		settle();
		expect(result.current.history.canRedo).toBe(false);
		expect(result.current.history.canUndo).toBe(true);
	});

	it('reset clears the stack so a loaded version cannot be undone into the previous graph', () => {
		const { result } = renderHook(() => useHarness());
		settle();
		act(() => result.current.setNodes([...startNodes, makeNode('method-1', 240)]));
		settle();
		expect(result.current.history.canUndo).toBe(true);

		act(() => {
			result.current.history.reset();
			result.current.setNodes([makeNode('loaded-1')]);
		});
		settle();
		expect(result.current.history.canUndo).toBe(false);
		expect(result.current.history.canRedo).toBe(false);
	});
});
