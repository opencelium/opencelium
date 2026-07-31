import type { RowData, ColumnDef } from '@tanstack/react-table';
import type {ConfirmOptions} from "@shared/ui/confirm/ConfirmDialog.types.ts";
import React from "react";

export interface RowAction<T> {
    label: string;
    onClick: (row: T) => void;
    danger?: boolean;
    confirm?: ConfirmOptions;
}

export interface BulkAction<T> {
    label: string;
    onClick: (rows: T[]) => void;
    danger?: boolean;
    confirm?: ConfirmOptions;
}

export interface TableFilter<T> {
    field: keyof T;
    label?: string;

    render: (params: {
        value: unknown;
        setValue: (value: unknown) => void;
    }) => React.ReactNode;
}

export interface DataTableProps<T extends RowData> {
    data: T[];
    columns: ColumnDef<T>[];

    searchable?: boolean;

    filterable?: boolean;
    filters?: TableFilter<T>[];

    rowActions?: RowAction<T>[];
    bulkActions?: BulkAction<T>[];
}

export type AppColumnDef<T> = ColumnDef<T> & {
    sortable?: boolean;
};
