import React, { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { Select } from '@shared/ui/primitives/Select'
import { Typography } from '@shared/ui/primitives/Typography'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetUsersQuery } from '@entities/user/api/userApi'
import type { User } from '@entities/user/model/types'
import { useGetGlobalVariablePermissionsQuery, useUpdateGlobalVariablePermissionsMutation } from '../../api/globalVariableApi'
import { toGrantDrafts, togglePermission, toPermissionsDto, type GrantDraft } from '../../model/sharing'
import type { GlobalVariablePermissions, VariablePermission } from '../../model/types'
import { GlobalVariableSharingTable } from './GlobalVariableSharingTable'

const userLabel = (user: User) =>
    [user.userDetail?.name, user.userDetail?.surname].filter(Boolean).join(' ') || user.username || user.email || `#${user.userId}`

export const GlobalVariableSharing: React.FC<{ id: number }> = ({ id }) => {
    const { data: permissions, isLoading } = useGetGlobalVariablePermissionsQuery(id)
    if (isLoading || !permissions) return <Loading size="sm" />
    // Keyed by version so a saved or refetched grant list starts a fresh draft.
    return <SharingEditor key={permissions.version} id={id} permissions={permissions} />
}

const SharingEditor: React.FC<{ id: number; permissions: GlobalVariablePermissions }> = ({ id, permissions }) => {
    const { t } = useI18n('entities')
    const { data: users = [] } = useGetUsersQuery({ page: 0, limit: 1000 })
    const [savePermissions, { isLoading: isSaving }] = useUpdateGlobalVariablePermissionsMutation()
    const [drafts, setDrafts] = useState<GrantDraft[]>(() => toGrantDrafts(permissions))

    const addableUsers = useMemo(
        () => users
            .filter((user) => user.userId !== permissions.ownerUser.id && !drafts.some((draft) => draft.userId === user.userId))
            .map((user) => ({ value: user.userId, label: userLabel(user) })),
        [users, drafts, permissions],
    )

    const toggle = useCallback((userId: number, permission: VariablePermission, isOn: boolean) =>
        setDrafts((current) => current.map((draft) => (draft.userId === userId
            ? { ...draft, permissions: togglePermission(draft.permissions, permission, isOn) }
            : draft))), [])
    const remove = useCallback((userId: number) =>
        setDrafts((current) => current.filter((item) => item.userId !== userId)), [])
    const addUser = (userId: number) => {
        const label = addableUsers.find((option) => option.value === userId)?.label ?? `#${userId}`
        setDrafts((current) => [...current, { userId, name: label, permissions: ['VIEW_USE'] }])
    }
    const save = async () => {
        const result = await savePermissions({ id, body: toPermissionsDto(drafts, permissions.version) })
        if (!('error' in result)) message.success(t('global-variable.sharing.saved'))
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="global-variable-sharing">
            <Typography variant="body">{t('global-variable.sharing.owner', { name: permissions.ownerUser.name })}</Typography>
            <GlobalVariableSharingTable drafts={drafts} onToggle={toggle} onRemove={remove} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 260 }}>
                    <Select
                        value={undefined}
                        options={addableUsers}
                        onChange={(value) => addUser(Number(value))}
                        placeholder={t('global-variable.sharing.addUser')}
                        testId="global-variable-sharing-add-user"
                    />
                </div>
                <Button type="primary" loading={isSaving} onClick={() => void save()} testId="global-variable-sharing-save">
                    {t('global-variable.sharing.save')}
                </Button>
            </div>
        </div>
    )
}
