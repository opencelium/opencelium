import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ONBOARDING_Z_INDEX } from '../../model/types'
import { CommandHint } from '../../ui/CommandHint'
import type { TutorialPick, TutorialStep } from '../model/tutorialSteps'
import '../../ui/onboardingCode.css'
import './tutorialPill.css'

/** Reopens this tutorial from the palette, once dismissed — the introduction is
 *  the only step that says so, since it is the one a returning user actually sees. */
const RESTART_COMMAND = 'help workflow'
/** The introduction, which is the first step by definition. */
const INTRO_INDEX = 0

type TutorialPillProps = {
    copy: string
    /** Which corner to sit in — see TutorialStep.anchor for when it moves. */
    anchor?: TutorialStep['anchor']
    /** A code sample for this step, if it has one. Not translated — it is code. */
    example?: string
    /** Choices to make, in order, if the step is a sequence of picks. */
    picks?: TutorialPick[]
    index: number
    total: number
    /** Set only for a step the canvas cannot detect, which the user closes by hand. */
    onNext?: () => void
    onClose: () => void
}

/**
 * Docked in a corner rather than centred: the tutorial points at controls across the
 * whole editor, so a dialog in the middle would sit on top of the very thing it is
 * asking the user to click. The exceptions are the two steps that book-end it — the
 * introduction and the closing read-back — which point at nothing and take the
 * `center` anchor.
 */
export function TutorialPill({ copy, anchor, example, picks, index, total, onNext, onClose }: TutorialPillProps) {
    const { t } = useI18n('onboarding')
    // The editor's own namespace: a pick that names one of its options is rendered
    // from the very key the dropdown renders, rather than from a copy of the label.
    const { t: tWorkflow } = useI18n('workflow')
    const base = `workflow.steps.${copy}`
    // Only the centred introduction reorders the footer: Exit on its own at the
    // left, Next at the right, so the primary "go on" action and the "leave"
    // action read as opposites rather than as two options next to each other —
    // every other step keeps Next and Exit stacked together on the right. Tied to
    // having a Next as well as to the anchor: the closing step is centred too, and
    // with nothing to oppose it a lone Exit belongs where every other step puts it.
    const exitButton = (
        <Button color="danger" variant="solid" onClick={onClose} testId="workflow-tutorial-exit">
            {t('workflow.actions.done')}
        </Button>
    )
    const nextButton = onNext && (
        <Button type="primary" onClick={onNext} testId="workflow-tutorial-next">
            {t('actions.next')}
        </Button>
    )
    const hint = <span className="workflow-tutorial-pill__hint">{t(`${base}.note`)}</span>

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
            {/* The introduction alone, not every centred step: the closing one is read
                on the way out, where how to get back in is not yet the question. */}
            {anchor === 'center' && index === INTRO_INDEX && <CommandHint command={RESTART_COMMAND} />}
            {picks ? (
                <ol className="workflow-tutorial-pill__picks">
                    {picks.map(pick => (
                        <li key={pick.label ?? pick.labelKey}>
                            {pick.labelKey ? tWorkflow(pick.labelKey, pick.values) : pick.label}
                        </li>
                    ))}
                </ol>
            ) : null}
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
                {anchor === 'center' && nextButton
                    ? <>{exitButton}{hint}{nextButton}</>
                    : <>{hint}{nextButton}{exitButton}</>}
            </footer>
        </aside>
    )
}
