import { describe, expect, it } from 'vitest';
import { parseListUrl, serializeListUrl } from './useListUrlState';

const defaults = {
    filters: { enabled: true },
    sorting: [{ id: 'name', desc: false }],
    sortFields: ['name', 'status'],
    pageSize: 10,
};

describe('list URL state', () => {
    it('restores and serializes a shared list URL', () => {
        const params = new URLSearchParams('q=nightly&f.enabled=false&sort=status:desc&page=3&size=20');
        const state = parseListUrl(params, defaults);
        expect(state).toEqual({
            globalFilter: 'nightly',
            filterState: { enabled: false },
            sorting: [{ id: 'status', desc: true }],
            pagination: { pageIndex: 2, pageSize: 20 },
        });
        expect(serializeListUrl(params, state, defaults).toString()).toBe(params.toString());
    });

    it('falls back for invalid values and omits defaults', () => {
        const params = new URLSearchParams('q=&f.enabled=invalid&f.unknown=true&sort=missing:asc&page=-2&size=999');
        const state = parseListUrl(params, defaults);
        expect(state).toEqual(parseListUrl(new URLSearchParams(), defaults));
        expect(serializeListUrl(params, state, defaults).toString()).toBe('');
    });

    it('preserves an explicitly cleared sort and unrelated parameters', () => {
        const params = new URLSearchParams('sort=&tab=details');
        const state = parseListUrl(params, defaults);
        expect(state.sorting).toEqual([]);
        expect(serializeListUrl(params, state, defaults).get('tab')).toBe('details');
        expect(serializeListUrl(params, state, defaults).get('sort')).toBe('');
    });
});
