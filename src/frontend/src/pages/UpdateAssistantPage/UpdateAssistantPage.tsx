import { useState } from 'react'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { EntityWizard } from '@/engine/entity/runtime/EntityWizard'
import { useGetInstallationInfoQuery, useMigrateUpdateMutation } from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Alert } from '@shared/ui/primitives/Alert'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { onlineStatus } from '@shared/network/onlineStatus'
import type { UpdateMode } from '@entities/updateAssistant/model/types'

const SOURCES_INSTALLATION_TYPE = 'sources'

export function UpdateAssistantPage() {
    const { t } = useI18n('entities')
    const { data, isLoading, isError } = useGetInstallationInfoQuery()
    const [migrateUpdate] = useMigrateUpdateMutation()
    const confirm = useConfirm()
    // Created once: EntityWizard calls form.reset whenever initialValues changes identity, and
    // this page re-renders whenever the confirm dialog opens (and on connectivity flips).
    const [initialValues] = useState(() => ({
        systemHealth: null,
        updateMode: (onlineStatus.getSnapshot() ? 'online' : 'offline') satisfies UpdateMode,
        versionsDisplay: [],
        runUpdateAction: null,
    }))

    const handleSubmit = async (formData: unknown) => {
        const { versionsDisplay } = formData as { versionsDisplay: string }
        const confirmed = await confirm({
            title: t('update-assistant.update.confirmRun.title'),
            message: t('update-assistant.update.confirmRun.message', { version: versionsDisplay }),
            confirmText: t('update-assistant.update.confirmRun.confirm'),
            cancelText: t('update-assistant.update.confirmRun.cancel'),
        })
        if (!confirmed) {
            throw new Error('Update cancelled by user')
        }
        await migrateUpdate({ version: versionsDisplay }).unwrap()
    }

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
                onSubmit={handleSubmit}
                initialValues={initialValues}
                header="update-assistant.wizard.modes.view.header"
                subheader="update-assistant.wizard.modes.view.subheader"
            />
        </PageWrapper>
    )
}
