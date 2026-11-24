import React from 'react'
import { useParams } from 'react-router-dom'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { useGlobalVariableSubmit } from '../form/useGlobalVariableSubmit'
import { GlobalVariableUpdateForm } from '../form/GlobalVariableUpdateForm'
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
    const id = Number(useParams().id)
    return (
        <PageWrapper>
            <GlobalVariableUpdateForm id={id} />
        </PageWrapper>
    )
}
