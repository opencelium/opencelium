import { Fragment } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import '../onboardingIntro.css'

export function IntegrationLayersContent() {
    const { t } = useI18n('onboarding')
    const layers = [
        { name: 'Invoker', body: t('content.layers.invoker'), example: 'jira.xml' },
        { name: 'Connector', body: t('content.layers.connector'), example: 'Jira Production' },
        { name: 'Workflow', body: t('content.layers.workflow'), example: 'Jira → Zendesk Sync' },
    ]
    return (
        <div>
            <p>{t('content.layers.body')}</p>
            <div className="onboarding-layer-grid">
                {layers.map((layer, index) => (
                    <Fragment key={layer.name}>
                        {index > 0 && <b aria-hidden>→</b>}
                        <article>
                            <small>{t('content.layers.step', { count: index + 1 })}</small>
                            <strong>{layer.name}</strong>
                            <span>{layer.body}</span>
                            <code>{layer.example}</code>
                        </article>
                    </Fragment>
                ))}
            </div>
        </div>
    )
}
