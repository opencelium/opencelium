import type { ColumnSizingState } from '@tanstack/react-table';

const KEY_PREFIX = 'oc:table-cols:';

export function loadColumnSizing(tableKey: string): ColumnSizingState {
    if (typeof localStorage === 'undefined' || !tableKey) return {};
    try {
        const raw = localStorage.getItem(KEY_PREFIX + tableKey);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ColumnSizingState) : {};
    } catch {
        return {};
    }
}

export function saveColumnSizing(tableKey: string, sizing: ColumnSizingState): void {
    if (typeof localStorage === 'undefined' || !tableKey) return;
    try {
        if (!sizing || Object.keys(sizing).length === 0) {
            localStorage.removeItem(KEY_PREFIX + tableKey);
            return;
        }
        localStorage.setItem(KEY_PREFIX + tableKey, JSON.stringify(sizing));
    } catch {
        //
    }
}
