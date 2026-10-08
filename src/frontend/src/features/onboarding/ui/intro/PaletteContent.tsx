import { Trans } from 'react-i18next'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { usePaletteKeyLabel } from '../usePaletteKeyLabel'
import '../onboardingIntro.css'
import '../onboardingCode.css'


/**
 * Real commands, verb-first, matching the registered trees: `create` -> <entity>,
 * `upload` -> invoker, `list` -> <plural>. The palette has no object-first form,
 * so examples written the other way round simply do not resolve.
 */
const EXAMPLE_COMMANDS = ['create connector', 'upload invoker', 'list schedules']

export function PaletteContent() {
    const { t } = useI18n('onboarding')
    const keyLabel = usePaletteKeyLabel()
    return (
        <div>
            <p>
                <Trans
                    ns="onboarding"
                    i18nKey="content.palette.body"
                    components={{ strong: <strong /> }}
                    values={{ key: keyLabel }}
                />
            </p>
            <div className="onboarding-copy-grid">
                <div>
                    <strong>{t('content.palette.tokens')}</strong>
                    <span>{t('content.palette.tokensBody')}</span>
                    {EXAMPLE_COMMANDS.map(command => <code key={command} className="onboarding-code-token">{command}</code>)}
                </div>
                <div>
                    <strong>{t('content.palette.help')}</strong>
                    <span>{t('content.palette.helpBody')}</span>
                    <code className="onboarding-code-token">help</code>
                </div>
            </div>
        </div>
    )
}
