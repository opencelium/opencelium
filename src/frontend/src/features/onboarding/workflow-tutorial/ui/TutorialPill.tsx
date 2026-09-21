import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ONBOARDING_Z_INDEX } from '../../model/types'
import type { TutorialStep } from '../model/tutorialSteps'
import '../../ui/onboardingCode.css'
import './tutorialPill.css'

type TutorialPillProps = {
    copy: string
    /** Which corner to sit in — see TutorialStep.anchor for when it moves. */
    anchor?: TutorialStep['anchor']
    /** A code sample for this step, if it has one. Not translated — it is code. */
    example?: string
    index: number
    total: number
    /** Set only for a step the canvas cannot detect, which the user closes by hand. */
    onNext?: () => void
    onClose: () => void
}

/**
 * Docked in a corner rather than centred: the tutorial points at controls across the
 * whole editor, so a dialog in the middle would sit on top of the very thing it is
 * asking the user to click.
 */
export function TutorialPill({ copy, anchor, example, index, total, onNext, onClose }: TutorialPillProps) {
    const { t } = useI18n('onboarding')
    const base = `workflow.steps.${copy}`

    return (
        <aside
            className={`workflow-tutorial-pill${anchor ? ` workflow-tutorial-pill--${anchor}` : ''}`}
            style={{ zIndex: ONBOARDING_Z_INDEX.checklist }}
            aria-label={t('workflow.kicker')}
        >
            <header>
                <span className="workflow-tutorial-pill__eyebrow">{t('workflow.kicker')}</span>
                <span className="workflow-tutorial-pill__counter">
                    {t('progress.counter', { current: index + 1, total })}
                </span>
            </header>
            <strong>{t(`${base}.title`)}</strong>
            <p>{t(`${base}.body`)}</p>
            {example ? <code className="onboarding-code-token workflow-tutorial-pill__example">{example}</code> : null}
            {/*
              * A step whose result shows up on the canvas advances by itself, so a Next
              * button there could only ever be a disabled ornament — the note carries
              * the instruction instead.
              *
              * Exit is on every step rather than only the last: this is a sandbox the
              * user should be able to leave the moment they want to, and a button says
              * so where a close icon in the corner did not.
              */}
            <footer>
                <span className="workflow-tutorial-pill__hint">{t(`${base}.note`)}</span>
                {onNext && (
                    <Button type="primary" onClick={onNext} testId="workflow-tutorial-next">
                        {t('actions.next')}
                    </Button>
                )}
                <Button type="primary" onClick={onClose} testId="workflow-tutorial-exit">
                    {t('workflow.actions.done')}
                </Button>
            </footer>
        </aside>
    )
}
