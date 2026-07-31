import React from 'react';
import { Table } from '@/shared/ui/primitives/Table';
import {usersMock} from "@features/sandbox/ui/table/user.mock.ts";
import {useUsersTable} from "@features/sandbox/ui/table/useUsersTable.tsx";

export const TestTable: React.FC = () => {
    const { table } = useUsersTable(usersMock);

    return (
        <Table
            data={usersMock}
            columns={table.options.columns}
            tableInstance={table}
            emptyState={<div>No users found</div>}
        />
    );
};
