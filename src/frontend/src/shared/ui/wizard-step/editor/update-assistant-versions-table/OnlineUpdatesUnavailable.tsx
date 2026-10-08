import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import {
    ONLINE_FEATURE_REASON_KEY,
    type OnlineFeatureBlockReason,
} from '@entities/subscription/model/useOnlineFeature'

type Props = {
    reason: OnlineFeatureBlockReason
    onSwitchToOffline: () => void
}

/**
 * Stands in for the versions table when the install cannot reach the update server.
 * Offline packages are still installable in that state, so the notice offers the
 * switch rather than leaving the step dead.
 */
export function OnlineUpdatesUnavailable({ reason, onSwitchToOffline }: Props) {
    const { t } = useI18n('entities')
    const { t: tCommon } = useI18n('common')

    return (
        <Alert
            type="warning"
            showIcon
            message={t('update-assistant.versions.onlineUnavailable.title')}
            description={tCommon(ONLINE_FEATURE_REASON_KEY[reason])}
            action={
                <Button onClick={onSwitchToOffline} testId="update-assistant-switch-to-offline">
                    {t('update-assistant.versions.onlineUnavailable.switchToOffline')}
                </Button>
            }
        />
    )
}
