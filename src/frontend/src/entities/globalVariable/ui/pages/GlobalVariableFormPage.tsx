import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { Alert } from '@shared/ui/primitives/Alert'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableQuery } from '../../api/globalVariableApi'
import { toFormValues } from '../../model/form'
import { useGlobalVariableSubmit } from '../form/useGlobalVariableSubmit'
import { GLOBAL_VARIABLE_ENTITY } from '../../globalVariable.constants'

export const GlobalVariableCreatePage: React.FC = () => {
    const submit = useGlobalVariableSubmit({ mode: 'create' })
    return (
        <PageWrapper>
            <EntityWizard entityName={GLOBAL_VARIABLE_ENTITY} mode="create" onSubmit={submit} />
        </PageWrapper>
    )
}

export const GlobalVariableUpdatePage: React.FC = () => {
    const { t } = useI18n('entities')
    const id = Number(useParams().id)
    const { data, isLoading, isError, refetch } = useGetGlobalVariableQuery(id, { skip: !Number.isFinite(id) })
    const submit = useGlobalVariableSubmit({ mode: 'update', id, reload: () => void refetch() })
    const initialValues = useMemo(() => (data ? toFormValues(data) : null), [data])

    const content = (() => {
        if (isLoading) return <Loading size="md" />
        if (isError || !data) return <Alert type="error" message={t('global-variable.notFound')} showIcon />
        if (!initialValues) return <Alert type="info" message={t('global-variable.save.kindNotEditableYet')} showIcon />
        if (!data.myPermissions.includes('EDIT')) return <Alert type="warning" message={t('global-variable.save.noEditPermission')} showIcon />
        return (
            <EntityWizard
                entityName={GLOBAL_VARIABLE_ENTITY}
                mode="update"
                initialValues={initialValues}
                onSubmit={submit}
                header="global-variable.wizard.modes.update.header"
                subheader="global-variable.wizard.modes.update.subheader"
            />
        )
    })()

    return <PageWrapper>{content}</PageWrapper>
}
