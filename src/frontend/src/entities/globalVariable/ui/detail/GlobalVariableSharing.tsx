import React, { useMemo, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Select } from '@shared/ui/primitives/Select'
import { Typography } from '@shared/ui/primitives/Typography'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetUsersQuery } from '@entities/user/api/userApi'
import type { User } from '@entities/user/model/types'
import { useGetGlobalVariablePermissionsQuery, useUpdateGlobalVariablePermissionsMutation } from '../../api/globalVariableApi'
import { GRANTABLE, toGrantDrafts, togglePermission, toPermissionsDto, type GrantDraft } from '../../model/sharing'
import type { GlobalVariablePermissions } from '../../model/types'

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

    const updateDraft = (userId: number, change: (draft: GrantDraft) => GrantDraft) =>
        setDrafts((current) => current.map((draft) => (draft.userId === userId ? change(draft) : draft)))
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, max-content) max-content', gap: '8px 16px', alignItems: 'center' }}>
                <Typography variant="label" isSubtle>{t('global-variable.sharing.user')}</Typography>
                {GRANTABLE.map((permission) => (
                    <Typography key={permission} variant="label" isSubtle>{t(`global-variable.permission.${permission}`)}</Typography>
                ))}
                <span />
                {drafts.map((draft) => (
                    <React.Fragment key={draft.userId}>
                        <span>{draft.name}</span>
                        {GRANTABLE.map((permission) => (
                            <Checkbox
                                key={permission}
                                checked={draft.permissions.includes(permission)}
                                onChange={(isOn: boolean) => updateDraft(draft.userId, (current) => ({
                                    ...current,
                                    permissions: togglePermission(current.permissions, permission, isOn),
                                }))}
                                testId={`global-variable-sharing-${draft.userId}-${permission.toLowerCase()}`}
                            />
                        ))}
                        <Tooltip content={t('global-variable.sharing.remove')} placement="top">
                            <DeleteIconButton
                                onClick={() => setDrafts((current) => current.filter((item) => item.userId !== draft.userId))}
                                testId={`global-variable-sharing-remove-${draft.userId}`}
                            />
                        </Tooltip>
                    </React.Fragment>
                ))}
            </div>
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
