import React from 'react'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { useWizardSubmit } from './useWizardSubmit'

interface Props {
    entityName: string
    /** Receives the created record as the API returned it, for callers that have to
     * act on the new id (the workflow's connector picker refreshes its status). */
    onSuccess?: (created?: unknown) => void
    skipSuccessState?: boolean
    hideRecommendations?: boolean
    hideHeader?: boolean
    compact?: boolean
    hiddenFields?: string[]
    /** Pre-fills specific fields, e.g. opening a connector form for a chosen invoker. */
    defaultValuesOverride?: Record<string, unknown>
}

export const GenericCreateWizard: React.FC<Props> = ({ entityName, onSuccess, skipSuccessState, hideRecommendations, hideHeader, compact, hiddenFields, defaultValuesOverride }) => {
    const submit = useWizardSubmit({ entityName, mode: 'create' })

    const handleSubmit = async (data: unknown) => {
        const created = await submit(data)
        onSuccess?.(created)
    }

    return <EntityWizard entityName={entityName} mode="create" onSubmit={handleSubmit} skipSuccessState={skipSuccessState} hideRecommendations={hideRecommendations} hideHeader={hideHeader} compact={compact} hiddenFields={hiddenFields} defaultValuesOverride={defaultValuesOverride} />
}
