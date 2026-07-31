import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    type ColumnDef,
} from '@tanstack/react-table';
import { useState } from 'react';
import type {User} from "@entities/user/model/types.ts";
import { tableDefaultColumn } from '@shared/ui/primitives/Table/Table.utils';

export function useUsersTable(data: User[]) {
    const [sorting, setSorting] = useState([]);

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'firstname',
            header: 'Name',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ getValue }) => {
                const role = getValue<string>();
                return role === 'admin' ? '🛡 Admin' : '👤 User';
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        defaultColumn: tableDefaultColumn,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return {
        table,
    };
}
