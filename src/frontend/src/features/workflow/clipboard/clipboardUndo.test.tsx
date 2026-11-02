import {useState} from 'react';
import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useWorkflowUndoHistory} from '../hooks/useWorkflowUndoHistory';
import {prepareClipboardPaste} from './clipboardGraph';
import {createWorkflowClipboard} from './workflowClipboard';
import type {WorkflowNodeModel, WorkflowEdgeModel} from '../types/workflow.types';
const start: WorkflowNodeModel = {id: 'start-1', type: 'start', position: {x: 0, y: 0}, data: {title: 'Start', kind: 'start'}};
const source: WorkflowNodeModel = {id: 'source', type: 'system', position: {x: 0, y: 0}, data: {title: 'Source', kind: 'system', color: '#123456'}};
afterEach(() => vi.useRealTimers());
describe('portable paste undo', () => {
    it('restores target nodes, edges and bindings in one undo', () => {
        vi.useFakeTimers();
        const hook = renderHook(() => {
            const [nodes, setNodes] = useState<WorkflowNodeModel[]>([start]);
            const [edges, setEdges] = useState<WorkflowEdgeModel[]>([]);
            const [bindings, setBindings] = useState<unknown[] | undefined>([]);
            const history = useWorkflowUndoHistory({nodes, edges, fieldBindings: bindings, isDragging: false,
                setNodes, setEdges, onFieldBindingsChange: setBindings});
            return {nodes, edges, bindings, history, paste: () => {
                const preview = prepareClipboardPaste(createWorkflowClipboard('A', ['source'], [source], []),
                    nodes, edges, bindings, {nodeId: start.id, direction: 'right'}, new Map(), new Set());
                setNodes(preview.nodes); setEdges(preview.edges); setBindings(preview.fieldBindings);
            }};
        });
        act(() => vi.advanceTimersByTime(400));
        act(() => hook.result.current.paste());
        act(() => vi.advanceTimersByTime(400));
        expect(hook.result.current.nodes).toHaveLength(2);
        act(() => hook.result.current.history.undo());
        expect(hook.result.current.nodes).toEqual([start]);
        expect(hook.result.current.edges).toEqual([]);
        expect(hook.result.current.bindings).toEqual([]);
    });
});
