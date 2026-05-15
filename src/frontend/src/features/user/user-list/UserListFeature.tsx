import { UserTable } from '@/entities/user/ui/UserTable'
import type { RowAction } from '@/shared/ui/table/types'
import type { User } from '@/entities/user/model/types'
import {useUserList} from "@features/user/user-list/useUserList.tsx";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

interface Props {
    onEdit?: (user: User) => void
    onDelete?: (user: User) => void
}

export function UserListFeature({
    onEdit,
    onDelete,
}: Props) {
    const {
        users,
        total,
        page,
        limit,
        setPage,
        isLoading,
    } = useUserList()

    const actions: RowAction<User>[] = []

    if (onEdit) {
        actions.push({
            label: 'Edit',
            onClick: onEdit,
        })
    }

    if (onDelete) {
        actions.push({
            label: 'Delete',
            onClick: onDelete,
        })
    }

    if (isLoading) return <Loading/>

    return (
        <>
            <UserTable data={users} actions={actions} />

            <div style={{ marginTop: 16 }}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    Prev
                </button>

                <span>
          Page {page} / {Math.ceil(total / limit)}
        </span>

                <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>
        </>
    )
}
