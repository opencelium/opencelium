import { DataTable } from '@/shared/ui/table/DataTable'
import type { User } from '@entities/user/model/types'
import { getUserColumns } from '@entities/user/model/getUserColumns.tsx'
import type { RowAction } from '@/shared/ui/table/types'

export function UserTable({
  data,
  actions,
}: {
  data: User[]
  actions: RowAction<User>[]
}) {
  const columns = getUserColumns(actions)

  return <DataTable<User> data={data} columns={columns} />
}
