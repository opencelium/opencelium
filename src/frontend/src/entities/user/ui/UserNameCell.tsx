import React from 'react'
import { useGetUsersQuery } from '@entities/user/api/userApi'

type Props = {
    userId: number | null
}

export const UserNameCell: React.FC<Props> = ({ userId }) => {
    const { data: users = [] } = useGetUsersQuery({ page: 1, limit: 1000 })

    if (userId == null) return null
    const user = users.find((candidate) => candidate.userId === userId)
    if (!user) return null

    return (
        <a href={`/user/update/${userId}`} target="_blank" rel="noopener noreferrer" title={user.email}>
            {user.userDetail.name} {user.userDetail.surname}
        </a>
    )
}
