import React from 'react'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { useGetInstallationInfoQuery } from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Alert } from '@shared/ui/primitives/Alert'

const SOURCES_INSTALLATION_TYPE = 'sources'

export function UpdateAssistantPage() {
    const { t } = useI18n('entities')
    const { data, isLoading, isError } = useGetInstallationInfoQuery()

    if (isLoading) {
        return (
            <PageWrapper>
                <Loading fullscreen />
            </PageWrapper>
        )
    }

    const installationType = data?.type
    const isSourcesInstallation = !isError && installationType === SOURCES_INSTALLATION_TYPE

    if (!isSourcesInstallation) {
        return (
            <PageWrapper>
                <Alert
                    type="warning"
                    showIcon
                    message={t('update-assistant.installationCheck.unavailable', {
                        type: installationType ?? 'unknown',
                    })}
                />
            </PageWrapper>
        )
    }

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
