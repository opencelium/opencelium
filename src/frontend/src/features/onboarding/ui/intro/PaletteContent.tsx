import { Trans } from 'react-i18next'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import '../onboardingIntro.css'

const EXAMPLE_COMMANDS = ['connector create', 'invoker upload', 'schedule run']

export function PaletteContent() {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p><Trans ns="onboarding" i18nKey="content.palette.body" components={{ strong: <strong /> }} /></p>
            <div className="onboarding-copy-grid">
                <div>
                    <strong>{t('content.palette.tokens')}</strong>
                    <span>{t('content.palette.tokensBody')}</span>
                    {EXAMPLE_COMMANDS.map(command => <code key={command}>{command}</code>)}
                </div>
                <div>
                    <strong>{t('content.palette.help')}</strong>
                    <span>{t('content.palette.helpBody')}</span>
                    <code className="onboarding-help-token">help</code>
                </div>
            </div>
        </div>
    )
}
