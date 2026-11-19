import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Tabs } from '@shared/ui/primitives/Tabs'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useGetGlobalVariableQuery } from '../../api/globalVariableApi'
import { GLOBAL_VARIABLE_PATH } from '../../globalVariable.constants'
import { GlobalVariableKindBadge } from '../GlobalVariableKindBadge'
import { useDeleteGlobalVariable } from '../delete/useDeleteGlobalVariable'
import { GlobalVariableOverview } from '../detail/GlobalVariableOverview'
import { GlobalVariableUsageTable } from '../detail/GlobalVariableUsageTable'
import { GlobalVariableChangeLog } from '../detail/GlobalVariableChangeLog'
import { GlobalVariableSharing } from '../detail/GlobalVariableSharing'

export const GlobalVariableDetailPage: React.FC = () => {
    const { t } = useI18n('entities')
    const navigate = useNavigate()
    const id = Number(useParams().id)
    const { user } = useAuth()
    const isAdmin = useIsAdmin()
    const { data: variable, isLoading, isError } = useGetGlobalVariableQuery(id, { skip: !Number.isFinite(id) })
    const { deleteGlobalVariable, isDeleting } = useDeleteGlobalVariable()

    if (isLoading) return <PageWrapper><Loading size="md" /></PageWrapper>
    if (isError || !variable) {
        return <PageWrapper><Alert type="error" message={t('global-variable.notFound')} showIcon /></PageWrapper>
    }

    const canEdit = variable.myPermissions.includes('EDIT')
    const canDelete = variable.myPermissions.includes('DELETE')
    const canShare = isAdmin || user?.userId === variable.ownerUser.id
    const handleDelete = async () => {
        if (await deleteGlobalVariable({ id: variable.id, name: variable.name })) navigate(GLOBAL_VARIABLE_PATH)
    }

    const tabs = [
        { key: 'usage', label: t('global-variable.detail.tabs.usage'), content: <GlobalVariableUsageTable id={variable.id} /> },
        { key: 'changes', label: t('global-variable.detail.tabs.changes'), content: <GlobalVariableChangeLog variable={variable} /> },
        ...(canShare
            ? [{ key: 'sharing', label: t('global-variable.detail.tabs.sharing'), content: <GlobalVariableSharing id={variable.id} /> }]
            : []),
    ]

    return (
        <PageWrapper>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="global-variable-detail">
                <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Typography variant="headline">{variable.name}</Typography>
                            <GlobalVariableKindBadge kind={variable.kind} />
                        </div>
                        {variable.description && <Typography variant="body" isSubtle>{variable.description}</Typography>}
                    </div>
                    {canEdit && (
                        <Button iconLeft="edit" onClick={() => navigate(`${GLOBAL_VARIABLE_PATH}/update/${variable.id}`)}
                            testId="global-variable-detail-edit">
                            {t('global-variable.detail.edit')}
                        </Button>
                    )}
                    {canDelete && (
                        <Button iconLeft="delete" loading={isDeleting} onClick={() => void handleDelete()}
                            testId="global-variable-detail-delete">
                            {t('global-variable.detail.delete')}
                        </Button>
                    )}
                </header>
                <GlobalVariableOverview variable={variable} />
                <Tabs items={tabs} defaultValue="usage" />
            </div>
        </PageWrapper>
    )
}
