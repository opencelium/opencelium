import type { ColumnDef } from '@tanstack/react-table'
import type { User } from './types.ts'
import type { RowAction } from '@shared/ui/table/types.ts'
import { RowActions } from '@shared/ui/table/RowActions.tsx'

export function getUserColumns(
  actions: RowAction<User>[],
): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'firstname',
      header: 'First name',
    },
    {
      accessorKey: 'lastname',
      header: 'Last name',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions
          row={row.original}
          actions={actions}
        />
      ),
    },
  ]
}
