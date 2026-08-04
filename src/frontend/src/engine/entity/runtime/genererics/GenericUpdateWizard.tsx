import React, { useMemo } from 'react'
import { entityRegistry } from '@/engine/entity/EntityRegistry'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { useWizardSubmit } from './useWizardSubmit'

interface Props {
    entityName: string
    identifier: string
    initialRecord?: unknown
    onSuccess?: () => void
    skipSuccessState?: boolean
    hideRecommendations?: boolean
}

export const GenericUpdateWizard: React.FC<Props> = ({
    entityName,
    identifier,
    initialRecord,
    onSuccess,
    skipSuccessState,
    hideRecommendations,
}) => {
    const entity = entityRegistry.get(entityName)
    if (!entity) throw new Error(`Entity "${entityName}" not found in registry`)

    const initialValues = useMemo(() => {
        if (!initialRecord || !entity.api) return undefined
        return entity.api.mapToForm ? entity.api.mapToForm(initialRecord) : initialRecord
    }, [initialRecord, entity])

    const submit = useWizardSubmit({ entityName, mode: 'update', identifier })

    const handleSubmit = async (data: unknown) => {
        await submit(data)
        onSuccess?.()
    }

    return (
        <EntityWizard
            entityName={entityName}
            mode="update"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            skipSuccessState={skipSuccessState}
            hideRecommendations={hideRecommendations}
            header={entity.wizard.modes?.update?.header || `${entity.name}: ${identifier}`}
            subheader={entity.wizard.modes?.update?.subheader}
        />
    )
}
