// Table.ant.tsx
import { Table, Pagination } from 'antd';
import { flexRender } from '@tanstack/react-table';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { findStretchColumnId, isRowClickIgnored, renderTruncatedCell } from './Table.utils';
import type { TableColumnMeta, TableProps } from './Table.types';
import './tableResize.css';

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
const MIN_COLUMN_WIDTH = 60;

type ColumnSizingSetter = (updater: (prev: Record<string, number>) => Record<string, number>) => void;

const ResizableHeaderCell: React.FC<any> = ({ resizeColumnId, currentWidth, setColumnSizing, style, children, ...rest }) => {
    const startResize = (event: React.MouseEvent<HTMLSpanElement>) => {
        if (!resizeColumnId || !setColumnSizing) return;
        event.preventDefault();
        event.stopPropagation();
        const handleEl = event.currentTarget;
        const th = handleEl.closest('th');
        const startX = event.clientX;
        const startWidth =
            typeof currentWidth === 'number'
                ? currentWidth
                : th
                    ? Math.round(th.getBoundingClientRect().width)
                    : MIN_COLUMN_WIDTH;
        handleEl.classList.add('tableColResizeHandle--active');
        const onMove = (moveEvent: MouseEvent) => {
            const next = Math.max(MIN_COLUMN_WIDTH, startWidth + (moveEvent.clientX - startX));
            setColumnSizing((prev: Record<string, number>) => ({ ...prev, [resizeColumnId]: next }));
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.userSelect = '';
            handleEl.classList.remove('tableColResizeHandle--active');
        };
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    return (
        <th {...rest} style={{ ...style, position: 'relative' }}>
            {children}
            {resizeColumnId && setColumnSizing && (
                <span
                    className="tableColResizeHandle"
                    onMouseDown={startResize}
                    onClick={(e) => e.stopPropagation()}
                />
            )}
        </th>
    );
};

const tableComponents = { header: { cell: ResizableHeaderCell } };

export const AntTable = ({
    tableInstance,
    emptyState,
    isLoading,
    disabledRowIds,
    rowClassName,
    serverTotal,
    onRowClick,
}: TableProps<any>) => {
    const rows = tableInstance.getRowModel().rows;
    const flatHeaders = tableInstance.getHeaderGroups()[0]?.headers ?? [];
    const columnSizing = tableInstance.getState().columnSizing ?? {};
    const setColumnSizing = tableInstance.setColumnSizing as ColumnSizingSetter;
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

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [frozen, setFrozen] = useState(false);
    useLayoutEffect(() => {
        if (frozen) return;
        if (rows.length === 0) return;
        const container = containerRef.current;
        if (!container) return;
        const measured: Record<string, number> = {};
        flatHeaders.forEach((header: any) => {
            const id = header.column.id;
            if (columnSizing[id] !== undefined) return;
            const th = container.querySelector<HTMLElement>(`thead th[data-col-id="${CSS.escape(id)}"]`);
            if (th) measured[id] = Math.round(th.getBoundingClientRect().width);
        });
        if (Object.keys(measured).length > 0) {
            setColumnSizing((prev) => ({ ...measured, ...prev }));
        }
        setFrozen(true);
    }, [rows.length, flatHeaders, stretchColumnId, columnSizing, setColumnSizing, frozen]);

    const columns = useMemo(
        () =>
            flatHeaders.map((header: any, colIndex: number) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const canSort = column.getCanSort();
                const explicitSize = column.columnDef.size;
                const meta = column.columnDef.meta as TableColumnMeta | undefined;
                const align = meta?.align;
                const isFirstColumn = colIndex === 0;

                const resizedWidth = columnSizing[column.id];
                const isStretchColumn = column.id === stretchColumnId;

                return {
                    key: column.id,
                    dataIndex: column.id,
                    ...(resizedWidth !== undefined
                        ? { width: resizedWidth }
                        : explicitSize !== undefined
                            ? { width: explicitSize }
                            : meta?.width !== undefined
                                ? { width: meta.width }
                                : isStretchColumn && !frozen
                                    ? { width: '100%' }
                                    : {}),
                    onHeaderCell: () => ({
                        resizeColumnId: !frozen && isStretchColumn ? undefined : column.id,
                        currentWidth: resizedWidth,
                        'data-col-id': column.id,
                        setColumnSizing,
                    }),
                    ...(align ? { align } : {}),
                    // Full-width rows (e.g. an empty-state placeholder under an expanded
                    // parent) collapse all data columns into one spanning cell.
                    onCell: (record: { __fullWidth?: boolean }) => {
                        if (!record?.__fullWidth) return {};
                        return isFirstColumn ? { colSpan: columnCount + (frozen ? 1 : 0) } : { colSpan: 0 };
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
        [flatHeaders, rows, columnCount, stretchColumnId, columnSizing, setColumnSizing, frozen],
    );

    const displayColumns = useMemo(() => {
        if (!frozen) return columns;
        return [
            ...columns,
            {
                key: '__oc_spacer',
                dataIndex: '__oc_spacer',
                title: '',
                onHeaderCell: () => ({}),
                onCell: (record: { __fullWidth?: boolean }) => (record?.__fullWidth ? { colSpan: 0 } : {}),
                render: () => null,
            },
        ];
    }, [columns, frozen]);

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
        // minWidth: 0 lets this shrink below its content width inside a flex-column
        // parent (GenericEntityList's page wrapper) — without it, the overflowX
        // below never actually engages since the wrapper just grows to fit the
        // table instead of clipping/scrolling it.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            {/* No `scroll.x` here on purpose — that forces every column to its full
                natural (max-content) width, which skips straight to "always scroll"
                instead of letting columns that don't need the space stay compact.
                overflowY is 'hidden', not 'visible' — per the CSS spec, pairing
                overflow-x:auto with overflow-y:visible gets the 'visible' one
                silently promoted to 'auto' too (they can't differ that way), which
                let a vertical scrollbar sneak in here. 'hidden' isn't 'visible', so
                it isn't subject to that coupling, and there's nothing to clip
                vertically anyway since this div always sizes to its own content.
                whiteSpace 'nowrap' (inherited by every cell's text) is what actually
                keeps row height fixed: without it, the browser's only way to shrink
                a column below its content's natural width is to wrap the text,
                which grows the row taller instead of scrolling horizontally — so a
                column only ever falls back to the scrollbar below, never to wrapping. */}
            <div
                ref={containerRef}
                className={frozen ? 'ocTableFixedLayout' : undefined}
                style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap' }}
            >
                <Table<any>
                    loading={isLoading}
                    dataSource={dataSource}
                    columns={displayColumns as any}
                    components={tableComponents}
                    rowSelection={rowSelection}
                    onRow={onRow}
                    pagination={false}
                    locale={{ emptyText: emptyState }}
                />
            </div>
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
