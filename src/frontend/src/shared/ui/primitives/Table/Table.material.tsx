import type { ReactNode } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
    Table as MuiTable,
    TableContainer,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Checkbox,
} from '@mui/material';
import { findStretchColumnId, isRowClickIgnored, renderTruncatedCell } from './Table.utils';
import type { TableColumnMeta, TableProps } from './Table.types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const MaterialTable = ({
    tableInstance,
    emptyState,
    isLoading,
    disabledRowIds,
    rowClassName,
    serverTotal,
    onRowClick,
}: TableProps<any>) => {
    const headerGroups = tableInstance.getHeaderGroups();
    const rows = tableInstance.getRowModel().rows;
    const hasRowSelection = tableInstance.options.enableRowSelection !== false;
    const disabledIdSet = new Set<string>(disabledRowIds ?? []);
    const stretchColumnId = findStretchColumnId(
        (headerGroups[0]?.headers ?? []).map((header) => header.column),
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

    if (isLoading) return <div>Loading...</div>;
    if (!rows.length) return <>{emptyState}</>;

    return (
        <>
        {/* minWidth: 0 lets this shrink below its content width inside a flex-column
            parent (GenericEntityList's page wrapper) — without it, overflowX never
            actually engages since the container just grows to fit the table instead
            of clipping/scrolling it. overflowY is 'hidden', not 'visible' — per the
            CSS spec, pairing overflow-x:auto with overflow-y:visible gets the
            'visible' one silently promoted to 'auto' too (they can't differ that
            way), which let a vertical scrollbar sneak in here. 'hidden' isn't
            'visible', so it isn't subject to that coupling, and there's nothing to
            clip vertically anyway since this container always sizes to its own
            content. whiteSpace 'nowrap' (inherited by every cell's text) keeps row
            height fixed: without it, the browser's only way to shrink a column
            below its content's natural width is to wrap the text, growing the row
            taller instead of scrolling horizontally. */}
        <TableContainer sx={{ overflowX: 'auto', overflowY: 'hidden', minWidth: 0, whiteSpace: 'nowrap' }}>
        <MuiTable>
            <TableHead>
                {headerGroups.map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {hasRowSelection && (
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={
                                        tableInstance.getIsSomePageRowsSelected()
                                    }
                                    checked={
                                        tableInstance.getIsAllPageRowsSelected()
                                    }
                                    onChange={
                                        tableInstance.getToggleAllPageRowsSelectedHandler()
                                    }
                                />
                            </TableCell>
                        )}

                        {headerGroup.headers.map((header) => {
                            const column = header.column;
                            const sorted = column.getIsSorted();
                            const canSort = column.getCanSort();
                            const explicitSize = column.columnDef.size;
                            const meta = column.columnDef.meta as TableColumnMeta | undefined;
                            const align = meta?.align;

                            return (
                                <TableCell
                                    key={header.id}
                                    align={align}
                                    onClick={
                                        canSort
                                            ? column.getToggleSortingHandler()
                                            : undefined
                                    }
                                    style={{
                                        cursor: canSort ? 'pointer' : 'default',
                                        ...(explicitSize !== undefined
                                            ? { width: explicitSize }
                                            : meta?.width !== undefined
                                                ? { width: meta.width }
                                                : column.id === stretchColumnId
                                                    ? { width: '100%' }
                                                    : {}),
                                    }}
                                >
                                    {flexRender(
                                        column.columnDef.header,
                                        header.getContext()
                                    )}

                                    {canSort && (
                                        <span style={{ marginLeft: 6 }}>
                      {sorted === 'asc' && '▲'}
                                            {sorted === 'desc' && '▼'}
                                            {!sorted && '⇅'}
                    </span>
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                ))}
            </TableHead>

            <TableBody>
                {rows.map((row) => {
                    const isDisabled = disabledIdSet.has(row.id);
                    const isSubRow = row.depth > 0;
                    const extraClassName = rowClassName ? rowClassName(row.original, row.id) : undefined;
                    // Row-click maps to the parent's update flow — only top-level rows opt in.
                    const clickable = !!onRowClick && !isDisabled && !isSubRow;
                    const fullWidth = row.original as { __fullWidth?: boolean; __fullWidthContent?: ReactNode };
                    if (fullWidth.__fullWidth) {
                        const colSpan = row.getVisibleCells().length + (hasRowSelection ? 1 : 0);
                        return (
                            <TableRow key={row.id} className={extraClassName}>
                                <TableCell colSpan={colSpan}>{fullWidth.__fullWidthContent}</TableCell>
                            </TableRow>
                        );
                    }
                    return (
                        <TableRow
                            key={row.id}
                            className={extraClassName}
                            hover={clickable}
                            onClick={
                                clickable
                                    ? (e) => {
                                          if (isRowClickIgnored(e.target)) return;
                                          onRowClick(row.original);
                                      }
                                    : undefined
                            }
                            sx={
                                isDisabled
                                    ? { opacity: 0.5, pointerEvents: 'none' }
                                    : clickable
                                      ? { cursor: 'pointer' }
                                      : undefined
                            }
                        >
                            {hasRowSelection && (
                                <TableCell padding="checkbox">
                                    {/* Sub-rows ride along with their parent and aren't selectable. */}
                                    {!isSubRow && (
                                        <Checkbox
                                            checked={row.getIsSelected()}
                                            disabled={!row.getCanSelect() || isDisabled}
                                            onChange={row.getToggleSelectedHandler()}
                                        />
                                    )}
                                </TableCell>
                            )}

                            {row.getVisibleCells().map((cell) => {
                                const meta = cell.column.columnDef.meta as TableColumnMeta | undefined;
                                const align = meta?.align;
                                const explicitSize = cell.column.columnDef.size;
                                return (
                                    <TableCell
                                        key={cell.id}
                                        align={align}
                                        style={
                                            explicitSize !== undefined
                                                ? { width: explicitSize }
                                                : meta?.width !== undefined
                                                    ? { width: meta.width }
                                                    : cell.column.id === stretchColumnId
                                                        ? { width: '100%' }
                                                        : undefined
                                        }
                                    >
                                        {renderTruncatedCell(cell)}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    );
                })}
            </TableBody>
        </MuiTable>
        </TableContainer>
        {isPaginated && totalRows > pageSize && (
            <TablePagination
                component="div"
                count={totalRows}
                page={pageIndex}
                rowsPerPage={pageSize}
                rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                onPageChange={(_, page) => tableInstance.setPageIndex(page)}
                onRowsPerPageChange={(e) => tableInstance.setPageSize(Number(e.target.value))}
            />
        )}
        </>
    );
};
