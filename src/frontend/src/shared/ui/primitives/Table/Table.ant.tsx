// Table.ant.tsx
import { Table, Pagination } from 'antd';
import { flexRender } from '@tanstack/react-table';
import React, { useCallback, useMemo } from 'react';
import { findStretchColumnId, isRowClickIgnored, renderTruncatedCell } from './Table.utils';

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
                      getCheckboxProps: (record: { key?: string }) => {
                          const row = record.key ? rowsByKey.get(record.key) : undefined;
                          const isSubRow = !!row && row.depth > 0;
                          return {
                              // Disabling excludes sub-rows from antd's "select all".
                              disabled: isSubRow || (!!record.key && disabledIdSet.has(record.key)),
                          };
                      },
                      // Sub-rows (depth > 0) ride along with their parent and aren't selectable.
                      renderCell: (
                          _value: boolean,
                          record: { key?: string },
                          _index: number,
                          originNode: React.ReactNode,
                      ) => {
                          const row = record.key ? rowsByKey.get(record.key) : undefined;
                          return row && row.depth > 0 ? null : originNode;
                      },
                  }
                : undefined,
        [hasRowSelection, selectedRowKeys, handleSelectionChange, disabledIdSet, rowsByKey],
    );

    const columnCount = flatHeaders.length;
    const stretchColumnId = useMemo(
        () => findStretchColumnId(flatHeaders.map((header) => header.column)),
        [flatHeaders],
    );

    const columns = useMemo(
        () =>
            flatHeaders.map((header, colIndex) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const canSort = column.getCanSort();
                const explicitSize = column.columnDef.size;
                const align = (column.columnDef.meta as { align?: 'left' | 'center' | 'right' } | undefined)?.align;
                const isFirstColumn = colIndex === 0;

                return {
                    key: column.id,
                    dataIndex: column.id,
                    ...(explicitSize !== undefined
                        ? { width: explicitSize }
                        : column.id === stretchColumnId
                            ? { width: '100%' }
                            : {}),
                    ...(align ? { align } : {}),
                    // Full-width rows (e.g. an empty-state placeholder under an expanded
                    // parent) collapse all data columns into one spanning cell.
                    onCell: (record: { __fullWidth?: boolean }) => {
                        if (!record?.__fullWidth) return {};
                        return isFirstColumn ? { colSpan: columnCount } : { colSpan: 0 };
                    },
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
                        const original = row.original as { __fullWidth?: boolean; __fullWidthContent?: React.ReactNode };
                        if (original.__fullWidth) {
                            return isFirstColumn ? original.__fullWidthContent : null;
                        }
                        const cell = row
                            .getVisibleCells()
                            .find((c) => c.column.id === column.id);
                        return renderTruncatedCell(cell);
                    },
                };
            }),
        [flatHeaders, rows, columnCount, stretchColumnId],
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
            // Row-click maps to the parent's update flow — only top-level rows opt in.
            const clickable = !!onRowClick && !isDisabled && !!row && row.depth === 0;
            return {
                ...(isDisabled ? { style: { opacity: 0.5, pointerEvents: 'none' as const } } : {}),
                ...(clickable ? { style: { cursor: 'pointer' } } : {}),
                ...(className ? { className } : {}),
                ...(clickable && row
                    ? {
                          onClick: (e: React.MouseEvent) => {
                              if (isRowClickIgnored(e.target)) return;
                              onRowClick(row.original);
                          },
                      }
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
            // Count top-level rows only — expanded sub-rows ride along and aren't paginated.
            ? tableInstance.getPrePaginationRowModel().rows.filter((r) => r.depth === 0).length
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
