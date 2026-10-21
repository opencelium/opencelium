import { useGetAppVersionQuery } from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Icon } from '@shared/ui/primitives/Icon'

const UPDATE_GUIDE_URL = 'https://docs.opencelium.io/en/prod/operations/updating.html'

export function AvailableUpdatesHeader() {
    const { t } = useI18n('entities')
    const { data } = useGetAppVersionQuery()

    return (
        <div className="ua-header">
            <h3 className="ua-header__title">{t('update-assistant.availableUpdates.title')}</h3>
            {data?.version && (
                <span className="ua-header__installed" data-testid="update-assistant-installed-version">
                    {t('update-assistant.availableUpdates.installed')} <strong>{data.version}</strong>
                </span>
            )}
            <a
                className="ua-header__guide"
                href={UPDATE_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="update-assistant-update-guide-link"
            >
                <Icon name="docs" size={16} color="inherit" />
                {t('update-assistant.availableUpdates.guideLink')}
            </a>
        </div>
    )
}
