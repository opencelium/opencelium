import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Icon } from '@shared/ui/primitives/Icon'
import { StepFooterStatus } from '@shared/ui/step-form/StepFooterSlotContext'

type Props = {
    isOffline: boolean
    hasVersions: boolean
    selectedVersion: string | null
}

export function VersionSelectionStatus({ isOffline, hasVersions, selectedVersion }: Props) {
    const { t } = useI18n('entities')

    const content = selectedVersion ? (
        <span className="ua-status ua-status--ready">
            <Icon name="check-circle" size={16} color="inherit" />
            {t('update-assistant.availableUpdates.status.ready', { version: selectedVersion })}
        </span>
    ) : (
        <span className="ua-status">
            {t(isOffline
                ? hasVersions
                    ? 'update-assistant.availableUpdates.status.selectPackage'
                    : 'update-assistant.availableUpdates.status.uploadPackage'
                : 'update-assistant.availableUpdates.status.selectVersion')}
        </span>
    )

    return (
        <StepFooterStatus>
            <div data-testid="update-assistant-selection-status">{content}</div>
        </StepFooterStatus>
    )
}
