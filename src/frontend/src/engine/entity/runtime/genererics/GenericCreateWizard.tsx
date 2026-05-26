import React from 'react'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { useWizardSubmit } from './useWizardSubmit'

interface Props {
    entityName: string
    onSuccess?: () => void
}

export const GenericCreateWizard: React.FC<Props> = ({ entityName, onSuccess }) => {
    const submit = useWizardSubmit({ entityName, mode: 'create' })

    const handleSubmit = async (data: unknown) => {
        await submit(data)
        onSuccess?.()
    }

    return <EntityWizard entityName={entityName} mode="create" onSubmit={handleSubmit} />
}
