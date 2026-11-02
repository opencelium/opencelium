import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useWorkflowClipboard} from './useWorkflowClipboard';
import {WORKFLOW_CLIPBOARD_KEY, type WorkflowClipboard} from './workflowClipboard';
const copy: WorkflowClipboard = {version: 1, sourceWorkflowId: 'A', rootIds: [], nodes: [], edges: [], fieldBindings: []};
afterEach(() => {localStorage.removeItem(WORKFLOW_CLIPBOARD_KEY); vi.restoreAllMocks();});
describe('workflow clipboard storage', () => {
    it('survives unmount and notifies all subscribers in the current tab', () => {
        const first = renderHook(useWorkflowClipboard);
        const second = renderHook(useWorkflowClipboard);
        act(() => first.result.current.copy(copy));
        expect(second.result.current.snapshot).toEqual(copy);
        first.unmount(); second.unmount();
        const reloaded = renderHook(useWorkflowClipboard);
        expect(reloaded.result.current.snapshot).toEqual(copy);
    });
    it('receives another tab’s storage event and replaces the previous copy', () => {
        const hook = renderHook(useWorkflowClipboard);
        act(() => {
            localStorage.setItem(WORKFLOW_CLIPBOARD_KEY, JSON.stringify(copy));
            window.dispatchEvent(new StorageEvent('storage', {key: WORKFLOW_CLIPBOARD_KEY}));
        });
        expect(hook.result.current.snapshot?.sourceWorkflowId).toBe('A');
        act(() => {
            localStorage.setItem(WORKFLOW_CLIPBOARD_KEY, JSON.stringify({...copy, sourceWorkflowId: 'B'}));
            window.dispatchEvent(new StorageEvent('storage', {key: WORKFLOW_CLIPBOARD_KEY}));
        });
        expect(hook.result.current.snapshot?.sourceWorkflowId).toBe('B');
    });
    it('ignores unsupported versions', () => {
        localStorage.setItem(WORKFLOW_CLIPBOARD_KEY, JSON.stringify({...copy, version: 42}));
        expect(renderHook(useWorkflowClipboard).result.current.snapshot).toBeNull();
    });
});
