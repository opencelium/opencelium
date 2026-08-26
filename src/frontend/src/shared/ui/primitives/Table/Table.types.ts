import React from 'react';
import type { ReactNode } from 'react';
import type {
    ColumnDef,
    RowData,
    Table as TanTable,
} from '@tanstack/react-table';

/**
 * Column metadata carried outside tanstack's own `columnDef.size`, which is
 * strictly numeric (pixels). `width` here is a raw CSS width string (e.g.
 * `'20%'`) for columns that need percentage sizing instead of a fixed size.
 */
export type TableColumnMeta = {
    align?: 'left' | 'center' | 'right';
    width?: string;
    resizable?: boolean;
};

export interface TableProps<TData extends RowData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];

    tableInstance: TanTable<TData>;

    isLoading?: boolean;

    emptyState?: ReactNode;

    /**
     * Row IDs (matching tanstack `row.id`) that should be visually dimmed and
     * have their selection checkbox disabled. Useful while a bulk action is
     * in flight on those rows.
     */
    disabledRowIds?: string[];

    /**
     * Optional per-row class name. Called with the raw row data and the tanstack
     * `row.id`. Useful for adding transient visual states (e.g. a highlight pulse
     * after the row was just updated).
     */
    rowClassName?: (row: TData, rowId: string) => string | undefined;

    /**
     * Total row count for server-paginated tables. When provided, the pagination
     * footer renders with this count instead of the client-side row count — the
     * tanstack `pageIndex` / `pageSize` still drive the controls, so wiring
     * `onPaginationChange` + `manualPagination: true` lets each page change
     * trigger a refetch with the new params.
     */
    serverTotal?: number;

    /**
     * Fires when a row is clicked. When provided, rows render with a pointer
     * cursor. Disabled rows (`disabledRowIds`) ignore the click.
     */
    onRowClick?: (row: TData) => void;
}

export type TableComponent<TData extends RowData> =
    React.FC<TableProps<TData>>;
