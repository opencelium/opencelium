import { can } from '@/shared/permissions/can'
import { useAuth } from '@/features/auth/useAuth'
import type { RowAction } from './types'

export function RowActions<T>({
  row,
  actions,
}: {
  row: T
  actions: RowAction<T>[]
}) {
  const { user } = useAuth()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {actions.map((action) =>
        can({
          permission: action.permission,
          user,
          entity: row,
        }) ? (
          <button
            key={action.id}
            onClick={() => action.onClick(row)}
          >
            {action.label}
          </button>
        ) : null,
      )}
    </div>
  )
}
