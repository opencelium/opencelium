import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    type ColumnDef,
} from '@tanstack/react-table';
import { useState } from 'react';

export function useDataTable<T>({
    data,
    columns,
}: {
    data: T[];
    columns: ColumnDef<T>[];
}) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnFilters, setColumnFilters] = useState([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        enableSorting: true,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return {
        table,
        globalFilter,
        setGlobalFilter,
    };
}
