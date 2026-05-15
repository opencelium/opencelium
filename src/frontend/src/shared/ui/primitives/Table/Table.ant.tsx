// Table.ant.tsx
import { Table, Pagination } from 'antd';
import { flexRender } from '@tanstack/react-table';
import React, { useCallback, useMemo } from 'react';
import { renderTruncatedCell } from './Table.utils';

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

export const AntTable = ({
    tableInstance,
    emptyState,
    isLoading,
    disabledRowIds,
    rowClassName,
    serverTotal,
    onRowClick,
}) => {
    const rows = tableInstance.getRowModel().rows;
    const flatHeaders = tableInstance.getHeaderGroups()[0]?.headers ?? [];
    const rowsByKey = useMemo(() => {
        const map = new Map<string, typeof rows[number]>();
        rows.forEach((row) => map.set(row.id, row));
        return map;
    }, [rows]);

    const hasRowSelection = tableInstance.options.enableRowSelection !== false;
    const disabledIdSet = useMemo(
        () => new Set<string>(disabledRowIds ?? []),
        [disabledRowIds],
    );

    const handleSelectionChange = useCallback(
        (selectedKeys: React.Key[]) => {
            const next: Record<string, boolean> = {};
            selectedKeys.forEach((key) => {
                next[String(key)] = true;
            });
            tableInstance.setRowSelection(next);
        },
        [tableInstance],
    );

    const rowSelectionState = tableInstance.getState().rowSelection;
    const selectedRowKeys = useMemo(
        () =>
            hasRowSelection
                ? Object.keys(rowSelectionState ?? {}).filter((id) => rowSelectionState[id])
                : undefined,
        [hasRowSelection, rowSelectionState],
    );

    const rowSelection = useMemo(
        () =>
            hasRowSelection
                ? {
                      selectedRowKeys,
                      onChange: handleSelectionChange,
                      preserveSelectedRowKeys: true,
                      getCheckboxProps: (record: { key?: string }) => ({
                          disabled: !!record.key && disabledIdSet.has(record.key),
                      }),
                  }
                : undefined,
        [hasRowSelection, selectedRowKeys, handleSelectionChange, disabledIdSet],
    );

    const columns = useMemo(
        () =>
            flatHeaders.map((header) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const canSort = column.getCanSort();
                const explicitSize = column.columnDef.size;
                const align = (column.columnDef.meta as { align?: 'left' | 'center' | 'right' } | undefined)?.align;

                return {
                    key: column.id,
                    dataIndex: column.id,
                    ...(explicitSize !== undefined ? { width: explicitSize } : {}),
                    ...(align ? { align } : {}),
                    title: (
                        <div
                            onClick={canSort ? column.getToggleSortingHandler() : undefined}
                            style={{
                                cursor: canSort ? 'pointer' : 'default',
                                display: 'flex',
                                gap: 6,
                                whiteSpace: "pre",
                                justifyContent:
                                    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            {flexRender(header.column.columnDef.header, header.getContext())}

                            {canSort && (
                                <>
                                    {sorted === 'asc' && ' ▲'}
                                    {sorted === 'desc' && ' ▼'}
                                    {!sorted && ' ⇅'}
                                </>
                            )}
                        </div>
                    ),
                    render: (_: unknown, __: unknown, index: number) => {
                        const row = rows[index];
                        if (!row) return null;
                        const cell = row
                            .getVisibleCells()
                            .find((c) => c.column.id === column.id);
                        return renderTruncatedCell(cell);
                    },
                };
            }),
        [flatHeaders, rows],
    );

    const dataSource = useMemo(
        () => rows.map((r) => ({ ...r.original, key: r.id })),
        [rows],
    );

    const onRow = useCallback(
        (record: { key?: string }) => {
            const key = record.key;
            const isDisabled = !!(key && disabledIdSet.has(key));
            const row = key ? rowsByKey.get(key) : undefined;
            const className = row && rowClassName ? rowClassName(row.original, row.id) : undefined;
            const clickable = !!onRowClick && !isDisabled && !!row;
            return {
                ...(isDisabled ? { style: { opacity: 0.5, pointerEvents: 'none' as const } } : {}),
                ...(clickable ? { style: { cursor: 'pointer' } } : {}),
                ...(className ? { className } : {}),
                ...(clickable && row
                    ? { onClick: () => onRowClick(row.original) }
                    : {}),
            };
        },
        [disabledIdSet, rowsByKey, rowClassName, onRowClick],
    );

    const isServerPaginated = typeof serverTotal === 'number';
    const isPaginated = isServerPaginated || !!tableInstance.options.getPaginationRowModel;
    const { pageIndex, pageSize } = tableInstance.getState().pagination;
    const totalRows = isServerPaginated
        ? serverTotal
        : isPaginated
            ? tableInstance.getPrePaginationRowModel().rows.length
            : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Table
                loading={isLoading}
                dataSource={dataSource}
                columns={columns}
                rowSelection={rowSelection}
                onRow={onRow}
                pagination={false}
                locale={{ emptyText: emptyState }}
            />
            {isPaginated && totalRows > pageSize && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Pagination
                        current={pageIndex + 1}
                        pageSize={pageSize}
                        total={totalRows}
                        showSizeChanger
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        onChange={(page, nextSize) => {
                            if (nextSize !== pageSize) tableInstance.setPageSize(nextSize);
                            tableInstance.setPageIndex(page - 1);
                        }}
                    />
                </div>
            )}
        </div>
    );
};
