import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Typography } from '@shared/ui/primitives/Typography'
import { isAiConfigured, useGetAiHealthQuery } from '@features/ai-assistant/api/aiApi'
import { AiStatusSection } from './AiStatusSection'
import { AiModelsSection } from './AiModelsSection'
import { BeebotSettingsSection } from './BeebotSettingsSection'
import './aiSettingsPage.css'

/** The AI in one place: whether it is there, which model does what, and Beebot. */
export function AiSettingsPage() {
    const { t } = useI18n('entities')
    const isConfigured = isAiConfigured()
    const health = useGetAiHealthQuery(undefined, { skip: !isConfigured, refetchOnMountOrArgChange: true })
    return (
        <PageWrapper>
            <div className="aiSettingsPage" data-testid="ai-settings-page">
                <header>
                    <h1 style={{ marginBottom: 8 }}>
                        <Typography variant="headline" as="span">{t('ai-settings.page.title')}</Typography>
                    </h1>
                    <div className="aiSettingsSubtitle"><Typography variant="body">{t('ai-settings.page.subtitle')}</Typography></div>
                </header>
                <AiStatusSection isConfigured={isConfigured} health={health.data} isUnreachable={health.isError}
                    isChecking={health.isFetching} onCheckAgain={() => void health.refetch()} />
                {health.data && <AiModelsSection health={health.data} />}
                {isConfigured && <BeebotSettingsSection />}
            </div>
        </PageWrapper>
    )
}
