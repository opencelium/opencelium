
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
} from '@tanstack/react-table';

export function useAppTable<TData>({
                                       data,
                                       columns,
                                   }: {
    data: TData[];
    columns: unknown[];
}) {
    return useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });
}
