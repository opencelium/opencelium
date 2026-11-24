import { useSyncExternalStore } from 'react';
import { parseWorkflowClipboard, WORKFLOW_CLIPBOARD_KEY, type WorkflowClipboard } from './workflowClipboard';
const CHANGE_EVENT = 'workflow-clipboard-change';
const subscribe = (listener: () => void) => {
    const onStorage = (event: StorageEvent) => {
        if (event.key === WORKFLOW_CLIPBOARD_KEY || event.key === null) listener();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(CHANGE_EVENT, listener);
    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(CHANGE_EVENT, listener);
    };
};
const getSnapshot = () => {
    try { return localStorage.getItem(WORKFLOW_CLIPBOARD_KEY); }
    catch { return null; }
};
export function useWorkflowClipboard() {
    const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
    return { snapshot: parseWorkflowClipboard(raw), copy: (snapshot: WorkflowClipboard) => {
        const json = JSON.stringify(snapshot);
        localStorage.setItem(WORKFLOW_CLIPBOARD_KEY, json);
        window.dispatchEvent(new Event(CHANGE_EVENT));
        if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(json).catch(() => {});
    }};
}
