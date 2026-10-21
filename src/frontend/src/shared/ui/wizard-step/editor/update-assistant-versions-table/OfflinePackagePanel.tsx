import type { ReactNode } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { OfflinePackageUploader } from './OfflinePackageUploader'

const PACKAGE_CLOUD_URL = 'https://packagecloud.io/becon/opencelium/'

type Props = {
    uploadedPackages?: ReactNode
}

export function OfflinePackagePanel({ uploadedPackages }: Props) {
    const { t } = useI18n('entities')

    return (
        <div className="ua-offline-panel">
            <div className="ua-offline-step">
                <span className="ua-offline-step__index">1</span>
                <div className="ua-offline-step__body">
                    <div className="ua-title">{t('update-assistant.availableUpdates.offline.download.title')}</div>
                    <div className="ua-description">
                        {t('update-assistant.availableUpdates.offline.download.description')}
                    </div>
                </div>
                <Button
                    iconRight="external-link"
                    onClick={() => window.open(PACKAGE_CLOUD_URL, '_blank', 'noopener,noreferrer')}
                    testId="update-assistant-packagecloud-link"
                >
                    {t('update-assistant.availableUpdates.offline.download.action')}
                </Button>
            </div>

            <div className="ua-offline-panel__divider" />

            <div className="ua-offline-step">
                <span className="ua-offline-step__index">2</span>
                <div className="ua-offline-step__body">
                    <div className="ua-title">{t('update-assistant.availableUpdates.offline.upload.title')}</div>
                    <div className="ua-description">
                        {t('update-assistant.availableUpdates.offline.upload.description')}
                    </div>
                    <div className="ua-offline-step__content">
                        {uploadedPackages}
                        <OfflinePackageUploader isCompact={Boolean(uploadedPackages)} />
                    </div>
                </div>
            </div>
        </div>
    )
}
