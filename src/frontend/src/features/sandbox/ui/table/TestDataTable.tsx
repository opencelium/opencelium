import React from 'react';
import {DataTable} from "@shared/table/DataTable.tsx";
import {usersMock} from "@features/sandbox/ui/table/user.mock.ts";
import {Switch} from "@shared/ui/primitives/Switch";
import {Select} from "@shared/ui/primitives/Select";

const TestDataTable = () => (
    <DataTable
        data={usersMock}
        columns={[
            {
                accessorKey: 'firstname',
                header: 'Name',
                enableSorting: true,
            },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'status', header: 'Status', filterFn: (row, columnId, filterValue) => {
                    if (!filterValue) return true;
                    return row.getValue(columnId) === filterValue;
                } },
        ]}
        searchable
        filters={[
            {
                field: 'status',
                render: ({ value, setValue }) => (
                    <Select
                        value={value}
                        onChange={setValue}
                        options={[
                            { label: 'All', value: undefined },
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ]}
                    />
                ),
            },
        ]}
        rowActions={[
            {
                label: 'Edit',
                onClick: (user) =>
                    console.log(`/users/${user.id}/edit`),
            },
            {
                label: 'Delete',
                danger: true,
                confirm: {
                    title: 'Delete user',
                    message: 'This action cannot be undone',
                    confirmText: 'Delete',
                    confirmVariant: 'danger',
                },
                onClick: () =>
                    console.log(`Open Confirm Dialog`),
            },
        ]}
        bulkActions={[
            {
                label: 'Delete selected',
                danger: true,
                confirm: {
                    title: 'Delete user',
                    message: 'This action cannot be undone',
                    confirmText: 'Delete',
                    confirmVariant: 'danger',
                },
                onClick: (rows) =>
                    console.log(rows.map((r) => r.id)),
            },
        ]}
    />

);

export default TestDataTable;
