import React, { useMemo } from 'react'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { Alert } from '@shared/ui/primitives/Alert'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableQuery } from '../../api/globalVariableApi'
import { toFormValues } from '../../model/form'
import { useGlobalVariableSubmit } from './useGlobalVariableSubmit'
import { GLOBAL_VARIABLE_ENTITY } from '../../globalVariable.constants'

type Props = {
    id: number
    /** Set when hosted in a dialog: replaces the wizard's success screen. */
    onSaved?: () => void
}

export const GlobalVariableUpdateForm: React.FC<Props> = ({ id, onSaved }) => {
    const { t } = useI18n('entities')
    const { data, isLoading, isError, refetch } = useGetGlobalVariableQuery(id, { skip: !Number.isFinite(id) })
    const submit = useGlobalVariableSubmit({ mode: 'update', id, reload: () => void refetch() })
    const initialValues = useMemo(() => (data ? toFormValues(data) : null), [data])

    if (isLoading) return <Loading size="md" />
    if (isError || !data) return <Alert type="error" message={t('global-variable.notFound')} showIcon />
    if (!initialValues) return <Alert type="info" message={t('global-variable.save.kindNotEditableYet')} showIcon />
    if (!data.myPermissions.includes('EDIT')) return <Alert type="warning" message={t('global-variable.save.noEditPermission')} showIcon />

    const handleSubmit = async (values: unknown) => {
        await submit(values)
        onSaved?.()
    }

    return (
        <EntityWizard
            entityName={GLOBAL_VARIABLE_ENTITY}
            mode="update"
            initialValues={initialValues}
            onSubmit={onSaved ? handleSubmit : submit}
            skipSuccessState={!!onSaved}
            header="global-variable.wizard.modes.update.header"
            subheader="global-variable.wizard.modes.update.subheader"
        />
    )
}
