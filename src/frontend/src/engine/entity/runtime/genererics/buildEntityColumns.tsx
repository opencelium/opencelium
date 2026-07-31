import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { EntityDefinition, FieldDefinition } from '@/engine/entity/EntityDefinition';
import type { TableColumnMeta } from '@shared/ui/primitives/Table/Table.types';
import { getValueByPath } from '@shared/utils/getValueByPath';

export type EntityColumnsContext = {
    /** Translator scoped to the `entities` namespace. */
    tEntities: (key: string, values?: Record<string, unknown>) => string;
};

const resolveHeader = (field: FieldDefinition, t: EntityColumnsContext['tEntities']): string => {
    const explicitKey = field.table?.labelKey ?? field.labelKey;
    if (explicitKey) return t(explicitKey);

    const literal = field.table?.label ?? field.label;
    if (literal) {
        const looksLikeKey = /^[a-zA-Z][\w-]*(\.[\w-]+)+$/.test(literal);
        return looksLikeKey ? t(literal) : literal;
    }

    return field.name;
};

const formatPrimitive = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'boolean') return value ? '✓' : '–';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

export function buildEntityColumns<T extends Record<string, unknown>>(
    entity: EntityDefinition,
    ctx: EntityColumnsContext,
): ColumnDef<T>[] {
    const fields = entity.fields
        .filter((field) => field.table && field.table.visible !== false)
        .slice()
        .sort((a, b) => {
            const ao = a.table?.order ?? Number.POSITIVE_INFINITY;
            const bo = b.table?.order ?? Number.POSITIVE_INFINITY;
            return ao - bo;
        });

    return fields.map((field) => {
        const tableCfg = field.table ?? {};

        const accessorFn = (row: T): unknown => {
            const raw = getValueByPath(row as unknown as Record<string, unknown>, field.name);
            return tableCfg.mapToValue ? tableCfg.mapToValue(row, raw) : raw;
        };

        const column: ColumnDef<T> = {
            id: field.name,
            header: () => resolveHeader(field, ctx.tEntities),
            accessorFn,
            cell: ({ row, getValue }) => {
                const value = getValue();
                if (tableCfg.render) return tableCfg.render(row.original, value);
                return formatPrimitive(value);
            },
            enableSorting: !!tableCfg.sortable,
            enableGlobalFilter: !!tableCfg.searchable,
        };

        // Numeric width maps to tanstack's own (pixel-only) column.size; a string
        // width (e.g. '20%') can't go through column.size — tanstack's sizing
        // feature is strictly numeric — so it rides in meta.width instead, and
        // the table primitives apply it as a raw CSS width themselves.
        if (typeof tableCfg.width === 'number') column.size = tableCfg.width;
        const meta: TableColumnMeta = {};
        if (tableCfg.align) meta.align = tableCfg.align;
        if (typeof tableCfg.width === 'string') meta.width = tableCfg.width;
        if (Object.keys(meta).length > 0) (column as ColumnDef<T> & { meta?: TableColumnMeta }).meta = meta;

        return column;
    });
}
