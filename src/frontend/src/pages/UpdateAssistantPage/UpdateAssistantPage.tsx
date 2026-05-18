import React from 'react'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'

export function UpdateAssistantPage() {
    return (
        <PageWrapper>
            <EntityWizard
                entityName="update-assistant"
                mode="create"
                initialValues={{
                    systemHealth: null,
                    updateMode: 'online',
                    versionsDisplay: [],
                    runUpdateAction: null,
                }}
                header="update-assistant.wizard.modes.view.header"
                subheader="update-assistant.wizard.modes.view.subheader"
            />
        </PageWrapper>
    )
}
