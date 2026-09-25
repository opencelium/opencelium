import { useDataTable } from './useDataTable';
import { Table } from '@/shared/ui/primitives/Table';
import { Input } from '@/shared/ui/primitives/Input';
import type {DataTableProps} from "@shared/table/DataTable.types.ts";
import {useMemo} from "react";
import {renderActionButton} from "@shared/table/renderActionButton.tsx";
import "./DataTable.css";

export function DataTable<T>({
    data,
    columns,
    filters,
    searchable,
    rowActions,
    bulkActions,
}: DataTableProps<T>) {
    const { table, globalFilter, setGlobalFilter } =
        useDataTable({ data, columns });

    const selectedRows = table
        .getSelectedRowModel()
        .rows.map((r) => r.original);

    const hasSelection = selectedRows.length > 0;

    // Add actions column dynamically
    const extendedColumns = useMemo(() => {
        return [
        ...columns,
        ...(rowActions
            ? [
                {
                    id: 'actions',
                    header: 'Actions',
                    meta: { resizable: false },
                    cell: ({ row }) => (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {rowActions?.map((action, i) =>
                                renderActionButton(
                                    action,
                                    row.original,
                                    i,
                                )
                            )}
                        </div>
                    ),
                },
            ]
            : []),
        ];
    }, [columns, rowActions]);

    table.setOptions((prev) => ({
        ...prev,
        columns: extendedColumns,
    }));

    return (
        <div className={'data-table'}>
            {searchable && (
                <Input
                    placeholder="Search..."
                    value={globalFilter}
                    onChange={(e) =>
                        setGlobalFilter(e.target.value)
                    }
                />
            )}

            <div className={'toolbar'}>
                {filters && (
                    <div>
                        {filters.map((filter, index) => {
                            const column = table.getColumn(
                                filter.field as string
                            );

                            const value = column?.getFilterValue();

                            return (
                                <div key={index} style={{minWidth: '100px'}}>
                                    {filter.render({
                                        value,
                                        setValue: (val) =>
                                            column?.setFilterValue(val),
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}

                {bulkActions && (
                    <div>
                        {bulkActions?.map((action, i) =>
                            renderActionButton(
                                action,
                                selectedRows,
                                i,
                                !hasSelection,
                            )
                        )}
                    </div>
                )}
            </div>

            <Table
                data={data}
                columns={extendedColumns}
                tableInstance={table}
                emptyState="No data"
            />
        </div>
    );
}
