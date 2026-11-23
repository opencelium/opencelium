import { useState } from 'react';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { useSearchParams } from 'react-router-dom';
import type { ListFilterState } from '../../EntityDefinition';

export type ListUrlState = {
    globalFilter: string;
    filterState: ListFilterState;
    sorting: SortingState;
    pagination: PaginationState;
};

type Defaults = {
    filters: ListFilterState;
    sorting: SortingState;
    sortFields: string[];
    pageSize: number;
};

function positiveInteger(value: string | null) {
    const number = value && /^[1-9]\d*$/.test(value) ? Number(value) : 0;
    return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

export function parseListUrl(params: URLSearchParams, defaults: Defaults): ListUrlState {
    const filterState = { ...defaults.filters };
    for (const key of Object.keys(filterState)) {
        const value = params.get(`f.${key}`);
        if (value === 'true' || value === 'false') filterState[key] = value === 'true';
    }

    const sort = params.get('sort');
    let sorting: SortingState = [];
    for (const entry of sort ? sort.split(',') : []) {
        const match = /^(.+):(asc|desc)$/.exec(entry);
        if (!match || !defaults.sortFields.includes(match[1]) || sorting.some(item => item.id === match[1])) {
            sorting = defaults.sorting;
            break;
        }
        sorting.push({ id: match[1], desc: match[2] === 'desc' });
    }

    const size = positiveInteger(params.get('size'));
    return {
        globalFilter: params.get('q') ?? '',
        filterState,
        sorting: sort === null ? defaults.sorting : sorting,
        pagination: {
            pageIndex: (positiveInteger(params.get('page')) ?? 1) - 1,
            pageSize: size && [10, 20, 50, 100, defaults.pageSize].includes(size) ? size : defaults.pageSize,
        },
    };
}

export function serializeListUrl(params: URLSearchParams, state: ListUrlState, defaults: Defaults) {
    const next = new URLSearchParams(params);
    for (const key of new Set(next.keys())) {
        if (['q', 'sort', 'page', 'size'].includes(key) || key.startsWith('f.')) next.delete(key);
    }
    if (state.globalFilter) next.set('q', state.globalFilter);
    for (const key of Object.keys(defaults.filters)) {
        const value = state.filterState[key];
        if (typeof value === 'boolean' && value !== defaults.filters[key]) next.set(`f.${key}`, String(value));
    }
    if (JSON.stringify(state.sorting) !== JSON.stringify(defaults.sorting)) {
        next.set('sort', state.sorting.map(({ id, desc }) => `${id}:${desc ? 'desc' : 'asc'}`).join(','));
    }
    if (state.pagination.pageIndex > 0) next.set('page', String(state.pagination.pageIndex + 1));
    if (state.pagination.pageSize !== defaults.pageSize) next.set('size', String(state.pagination.pageSize));
    return next;
}

export function useListUrlState(defaults: Defaults, syncUrl: boolean) {
    const [params, setParams] = useSearchParams();
    const [localState, setLocalState] = useState(() => parseListUrl(new URLSearchParams(), defaults));
    const state = syncUrl ? parseListUrl(params, defaults) : localState;
    const update = (apply: (previous: ListUrlState) => ListUrlState) => {
        if (!syncUrl) {
            setLocalState(apply);
            return;
        }
        const next = serializeListUrl(params, apply(state), defaults);
        if (next.toString() !== params.toString()) setParams(next, { replace: true });
    };
    return [state, update] as const;
}
