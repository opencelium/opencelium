import React from 'react';

import { Switch } from '@shared/ui/primitives/Switch';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';

import type {
    ListFilter,
    ListFilterState,
    ListFilterValue,
} from '@/engine/entity/EntityDefinition';

interface Props {
    filters: ListFilter[];
    state: ListFilterState;
    onChange: (key: string, value: ListFilterValue) => void;
}

export const ListFilters: React.FC<Props> = ({ filters, state, onChange }) => {
    const { t: tEntities } = useI18n('entities');

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 16,
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 6,
                background: 'var(--color-background-surface)',
            }}
        >
            {filters.map((filter) => {
                const label = filter.labelKey
                    ? tEntities(filter.labelKey as never)
                    : filter.label ?? filter.key;

                if (filter.type === 'switch') {
                    const checked = Boolean(state[filter.key]);
                    return (
                        <div
                            key={filter.key}
                            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                            <Switch
                                checked={checked}
                                onChange={(v) => onChange(filter.key, v)}
                            />
                            <Typography variant="body">{label}</Typography>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export const applyListFilters = (
    rows: unknown[],
    filters: ListFilter[],
    state: ListFilterState,
): unknown[] => {
    if (filters.length === 0) return rows;
    return rows.filter((row) =>
        filters.every((filter) => {
            if (filter.type === 'switch') {
                return filter.apply(row, Boolean(state[filter.key]));
            }
            return true;
        }),
    );
};

export const buildInitialFilterState = (filters: ListFilter[]): ListFilterState => {
    const state: ListFilterState = {};
    for (const filter of filters) {
        if (filter.type === 'switch') {
            state[filter.key] = filter.defaultValue ?? false;
        }
    }
    return state;
};
