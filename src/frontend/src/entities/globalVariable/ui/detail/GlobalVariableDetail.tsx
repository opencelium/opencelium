import React, { useMemo } from 'react'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { Alert } from '@shared/ui/primitives/Alert'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableQuery } from '../../api/globalVariableApi'
import { toFormValues } from '../../model/form'
import { GLOBAL_VARIABLE_ENTITY } from '../../globalVariable.constants'

/** The update wizard's steps, read-only. Usages, change log and sharing live in the details wizard. */
export const GlobalVariableDetail: React.FC<{ id: number }> = ({ id }) => {
    const { t } = useI18n('entities')
    const { data: variable, isLoading, isError } = useGetGlobalVariableQuery(id, { skip: !Number.isFinite(id) })
    const initialValues = useMemo(() => (variable ? toFormValues(variable) : null), [variable])

    if (isLoading) return <Loading size="md" />
    if (isError || !variable || !initialValues) return <Alert type="error" message={t('global-variable.notFound')} showIcon />

    return (
        <div data-testid="global-variable-detail">
            <EntityWizard
                entityName={GLOBAL_VARIABLE_ENTITY}
                mode="view"
                readOnly
                initialValues={initialValues}
                header={variable.name}
                subheader={variable.description ?? ''}
            />
        </div>
    )
}
