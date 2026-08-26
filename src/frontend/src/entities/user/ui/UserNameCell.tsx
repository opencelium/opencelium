import React from 'react'
import { useGetUsersQuery } from '@entities/user/api/userApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'

type Props = {
    userId: number | null
}

export const UserNameCell: React.FC<Props> = ({ userId }) => {
    const { data: users = [] } = useGetUsersQuery({ page: 1, limit: 1000 })
    const { t } = useI18n('common')

    const user = userId == null ? undefined : users.find((candidate) => candidate.userId === userId)
    if (!user) return <span>{t('user.unknown')}</span>

    return (
        <a href={`/user/update/${userId}`} target="_blank" rel="noopener noreferrer" title={user.email ?? user.username ?? undefined}>
            {user.userDetail.name} {user.userDetail.surname}
        </a>
    )
}
