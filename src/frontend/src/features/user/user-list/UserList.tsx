import React from 'react';
import {DataTable} from "@shared/table/DataTable.tsx";
import {Select} from "@shared/ui/primitives/Select";
import {useUserList} from "@features/user/user-list/useUserList.tsx";

const UserList = () => {
    const {
        users,
        total,
        page,
        limit,
        setPage,
        isLoading,
    } = useUserList()
    return (
        <DataTable
            data={users}
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
    )
}

export default UserList;
