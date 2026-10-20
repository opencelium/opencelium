import type { ReactNode } from 'react'
import { useGetAppVersionQuery } from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'

type Props = {
    title: string
    count?: number
    testId: string
    children: ReactNode
}

export function VersionsCard({ title, count, testId, children }: Props) {
    const { t } = useI18n('entities')
    const { data } = useGetAppVersionQuery()

    return (
        <div className="ua-versions-card" data-testid={testId}>
            <div className="ua-versions-card__header">
                <span className="ua-title">
                    {title}
                    {count !== undefined && <span className="ua-versions-card__count"> ({count})</span>}
                </span>
                {data?.version && (
                    <span className="ua-description">
                        {t('update-assistant.availableUpdates.selectableHint', { version: data.version })}
                    </span>
                )}
            </div>
            {children}
        </div>
    )
}
