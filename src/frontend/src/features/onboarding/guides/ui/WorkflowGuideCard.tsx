import { Button } from '@shared/ui/primitives/Button'
import { Icon } from '@shared/ui/primitives/Icon'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { WAKE_WORD } from '@features/ai-assistant/voice/wakeWord'
import { ONBOARDING_Z_INDEX } from '../../model/types'
import type { ActiveWorkflowGuide } from '../model/workflowGuide.store'
import type { GuideStep } from '../model/workflowGuides'
import '../../workflow-tutorial/ui/tutorialPill.css'
import './workflowGuide.css'

type Props = {
    active: ActiveWorkflowGuide
    steps: GuideStep[]
    current: number
    onNext: (() => void) | null
    onClose: () => void
}

/** The tutorial's corner card, reduced to one task: its steps, with the current one marked. */
export function WorkflowGuideCard({ active, steps, current, onNext, onClose }: Props) {
    const { t } = useI18n('onboarding')
    const base = `guides.${active.guideId}`
    const values = {
        method: active.methodLabel,
        name: WAKE_WORD.name,
        ...(active.guideId === 'method-transformation'
            ? { field: active.field ?? '', part: t(`guides.parts.${active.part}`) }
            : {}),
    }
    const isLast = current === steps.length - 1

    return (
        <aside className="workflow-tutorial-pill workflow-guide-card" style={{ zIndex: ONBOARDING_Z_INDEX.checklist }}
            aria-label={t('guides.kicker')} aria-live="polite" data-testid="workflow-guide-card">
            <header>
                <span className="workflow-tutorial-pill__eyebrow">{t('guides.kicker')}</span>
            </header>
            <strong>{t(`${base}.title`, values)}</strong>
            <ol className="workflow-guide-card__steps">
                {steps.map((step, index) => (
                    <li key={step.key} data-state={index < current ? 'done' : index === current ? 'current' : 'next'}>
                        <span className="workflow-guide-card__marker" aria-hidden>
                            {index < current ? <Icon name="check" size={12} color="inherit" /> : index + 1}
                        </span>
                        <span>{t(`${base}.${step.key}`, values)}</span>
                    </li>
                ))}
            </ol>
            <footer>
                {onNext && (
                    <Button type="primary" onClick={onNext} testId="workflow-guide-next">{t('guides.actions.next')}</Button>
                )}
                <Button type={isLast ? 'primary' : 'default'} onClick={onClose} testId="workflow-guide-close">
                    {t(isLast ? 'guides.actions.done' : 'guides.actions.stop')}
                </Button>
            </footer>
        </aside>
    )
}
