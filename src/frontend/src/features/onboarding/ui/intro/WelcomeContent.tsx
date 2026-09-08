import { useI18n } from '@shared/i18n/hooks/useI18n'
import '../onboardingIntro.css'

const PHASE_DOTS = [0, 1, 2, 3]

export function WelcomeContent({ userName }: { userName: string }) {
    const { t } = useI18n('onboarding')
    const phases = [
        t('content.welcome.theme'),
        t('content.welcome.palette'),
        t('content.welcome.invoker'),
        t('content.welcome.connector'),
    ]
    return (
        <div>
            <p>{t('content.welcome.lead')} {t('content.welcome.body')}</p>
            <div className="onboarding-duration-row">
                <strong className="onboarding-duration">{t('content.welcome.duration')}</strong>
                <span className="onboarding-phase-dots" aria-hidden>
                    {PHASE_DOTS.map(index => <i key={index} className={index === 0 ? 'is-current' : ''} />)}
                </span>
            </div>
            <div className="onboarding-phases" aria-label={t('content.welcome.phasesLabel')}>
                {phases.map(phase => <span key={phase}>{phase}</span>)}
            </div>
            <span className="onboarding-visually-hidden">{t('content.welcome.hidden', { name: userName })}</span>
        </div>
    )
}
