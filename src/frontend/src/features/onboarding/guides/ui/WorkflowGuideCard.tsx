import { Button } from '@shared/ui/primitives/Button'
import { Icon } from '@shared/ui/primitives/Icon'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ONBOARDING_Z_INDEX } from '../../model/types'
import type { GuidePhase } from '../model/useGuideTracking'
import type { WorkflowGuideId } from '../model/workflowGuides'
import '../../workflow-tutorial/ui/tutorialPill.css'
import './workflowGuide.css'

const PHASES: GuidePhase[] = ['node', 'menu', 'arrived']

type Props = {
    guideId: WorkflowGuideId
    methodLabel: string
    phase: GuidePhase
    onClose: () => void
}

/** The tutorial's corner card, reduced to one task: its steps, with the current one marked. */
export function WorkflowGuideCard({ guideId, methodLabel, phase, onClose }: Props) {
    const { t } = useI18n('onboarding')
    const base = `guides.${guideId}`
    const current = PHASES.indexOf(phase)

    return (
        <aside className="workflow-tutorial-pill workflow-guide-card" style={{ zIndex: ONBOARDING_Z_INDEX.checklist }}
            aria-label={t('guides.kicker')} aria-live="polite" data-testid="workflow-guide-card">
            <header>
                <span className="workflow-tutorial-pill__eyebrow">{t('guides.kicker')}</span>
            </header>
            <strong>{t(`${base}.title`, { method: methodLabel })}</strong>
            <ol className="workflow-guide-card__steps">
                {PHASES.map((step, index) => (
                    <li key={step} data-state={index < current ? 'done' : index === current ? 'current' : 'next'}>
                        <span className="workflow-guide-card__marker" aria-hidden>
                            {index < current ? <Icon name="check" size={12} color="inherit" /> : index + 1}
                        </span>
                        <span>{t(`${base}.${step}`, { method: methodLabel })}</span>
                    </li>
                ))}
            </ol>
            <footer>
                <Button type={phase === 'arrived' ? 'primary' : 'default'} onClick={onClose} testId="workflow-guide-close">
                    {t(phase === 'arrived' ? 'guides.actions.done' : 'guides.actions.stop')}
                </Button>
            </footer>
        </aside>
    )
}
