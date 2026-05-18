import type { Permission } from '@/shared/permissions/types'

export type RowAction<T> = {
  id: string
  label: string
  permission: Permission
  onClick: (row: T) => void
}
