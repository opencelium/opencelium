import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Typography } from '@shared/ui/primitives/Typography'
import { AiSettingsContent } from '@features/ai-assistant/settings/AiSettingsContent'
import './aiSettingsPage.css'

export function AiSettingsPage() {
    const { t } = useI18n('entities')
    return (
        <PageWrapper>
            <div className="aiSettingsPage" data-testid="ai-settings-page">
                <header>
                    <h1 style={{ marginBottom: 8 }}>
                        <Typography variant="headline" as="span">{t('ai-settings.page.title')}</Typography>
                    </h1>
                    <div className="aiSettingsSubtitle"><Typography variant="body">{t('ai-settings.page.subtitle')}</Typography></div>
                </header>
                <AiSettingsContent />
            </div>
        </PageWrapper>
    )
}
