import type {ColumnDef} from '@tanstack/react-table';
import type {EntityDefinition} from '@/engine/entity/EntityDefinition';
import {buildTestId} from '@shared/testing/testId';
import {RowExpander} from './RowExpander';

// Leading column that toggles a row's sub-rows. Only added when the list opts into
// sub-rows (entity.list.useRowSubRows); the toggle itself only appears on rows that
// actually have sub-rows. A pulsing count badge signals hidden rows while collapsed.
export function buildExpanderColumn<T extends Record<string, unknown>>(
    entity: EntityDefinition,
    headerLabel?: string,
): ColumnDef<T> {
    return {
        id: '__row_expander__',
        header: () => headerLabel ?? null,
        size: headerLabel ? 120 : 44,
        enableSorting: false,
        enableGlobalFilter: false,
        meta: {align: 'center'},
        cell: ({row}) => {
            if (!row.getCanExpand()) return null;
            // Placeholder sub-rows (e.g. an empty-state row) don't count toward the badge.
            const count = row.subRows.filter(
                (sub) => !(sub.original as {__placeholder?: boolean}).__placeholder,
            ).length;
            return (
                <RowExpander
                    expanded={row.getIsExpanded()}
                    count={count}
                    onToggle={row.getToggleExpandedHandler()}
                    testId={buildTestId(entity.name, 'row-expander', row.id)}
                />
            );
        },
    };
}
