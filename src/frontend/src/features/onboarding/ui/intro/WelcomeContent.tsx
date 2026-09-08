import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ONBOARDING_MILESTONES } from '../../model/types'
import '../onboardingIntro.css'

export function WelcomeContent({ userName }: { userName: string }) {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p>{t('content.welcome.lead')} {t('content.welcome.body')}</p>
            <div className="onboarding-duration-row">
                <strong className="onboarding-duration">
                    {t('content.welcome.duration', { phases: ONBOARDING_MILESTONES.length })}
                </strong>
            </div>
            <div className="onboarding-phases" aria-label={t('content.welcome.phasesLabel')}>
                {ONBOARDING_MILESTONES.map(milestone => (
                    <span key={milestone.id}>{t(`content.welcome.${milestone.key}`)}</span>
                ))}
            </div>
            <span className="onboarding-visually-hidden">{t('content.welcome.hidden', { name: userName })}</span>
        </div>
    )
}
