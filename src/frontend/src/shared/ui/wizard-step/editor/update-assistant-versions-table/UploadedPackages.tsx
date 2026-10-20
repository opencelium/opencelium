import type { ReactNode } from 'react'
import { useGetAppVersionQuery } from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'

type Props = {
    count: number
    children: ReactNode
}

export function UploadedPackages({ count, children }: Props) {
    const { t } = useI18n('entities')
    const { data } = useGetAppVersionQuery()

    return (
        <div className="ua-packages" data-testid="update-assistant-uploaded-packages">
            <div className="ua-packages__header">
                <span className="ua-title">
                    {t('update-assistant.availableUpdates.offline.packages.title')}{' '}
                    <span className="ua-packages__count">({count})</span>
                </span>
                {data?.version && (
                    <span className="ua-description">
                        {t('update-assistant.availableUpdates.offline.packages.selectableHint', { version: data.version })}
                    </span>
                )}
            </div>
            {children}
        </div>
    )
}
