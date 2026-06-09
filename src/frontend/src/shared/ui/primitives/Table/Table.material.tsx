import { flexRender } from '@tanstack/react-table';
import {
    Table as MuiTable,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Checkbox,
} from '@mui/material';
import { isRowClickIgnored, renderTruncatedCell } from './Table.utils';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const MaterialTable = ({
    tableInstance,
    emptyState,
    isLoading,
    disabledRowIds,
    rowClassName,
    serverTotal,
    onRowClick,
}) => {
    const headerGroups = tableInstance.getHeaderGroups();
    const rows = tableInstance.getRowModel().rows;
    const hasRowSelection = tableInstance.options.enableRowSelection !== false;
    const disabledIdSet = new Set<string>(disabledRowIds ?? []);

    const isServerPaginated = typeof serverTotal === 'number';
    const isPaginated = isServerPaginated || !!tableInstance.options.getPaginationRowModel;
    const { pageIndex, pageSize } = tableInstance.getState().pagination;
    const totalRows = isServerPaginated
        ? serverTotal
        : isPaginated
            ? tableInstance.getPrePaginationRowModel().rows.length
            : 0;

    if (isLoading) return <div>Loading...</div>;
    if (!rows.length) return <>{emptyState}</>;

    return (
        <>
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
                            const align = (column.columnDef.meta as { align?: 'left' | 'center' | 'right' } | undefined)?.align;

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
                                        ...(explicitSize !== undefined ? { width: explicitSize } : {}),
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
                    const extraClassName = rowClassName ? rowClassName(row.original, row.id) : undefined;
                    const clickable = !!onRowClick && !isDisabled;
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
                                    <Checkbox
                                        checked={row.getIsSelected()}
                                        disabled={!row.getCanSelect() || isDisabled}
                                        onChange={row.getToggleSelectedHandler()}
                                    />
                                </TableCell>
                            )}

                            {row.getVisibleCells().map((cell) => {
                                const align = (cell.column.columnDef.meta as { align?: 'left' | 'center' | 'right' } | undefined)?.align;
                                return (
                                    <TableCell key={cell.id} align={align}>
                                        {renderTruncatedCell(cell)}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    );
                })}
            </TableBody>
        </MuiTable>
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
