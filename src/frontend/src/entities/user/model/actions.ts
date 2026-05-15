import type { RowAction } from '@shared/ui/table/types.ts'
import type { User } from './types.ts'

export function createUserRowActions(
  handlers: {
    onEdit: (u: User) => void
    onDelete: (u: User) => void
  },
): RowAction<User>[] {
  return [
    {
      id: 'edit',
      label: 'Edit',
      permission: 'user.update',
      onClick: handlers.onEdit,
    },
    {
      id: 'delete',
      label: 'Delete',
      permission: 'user.delete',
      onClick: handlers.onDelete,
    },
  ]
}
