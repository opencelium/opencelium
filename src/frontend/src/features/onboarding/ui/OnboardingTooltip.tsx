import type { TooltipRenderProps } from 'react-joyride'
import type { ReactNode } from 'react'
import type { OnboardingStepKind } from '../model/types'
import './onboardingTooltip.css'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'

export type OnboardingTooltipData = {
    kicker: string
    kind?: OnboardingStepKind
    total: number
    footerNote?: ReactNode
    /** The secondary button renders only when a step gives it a label of its own. */
    secondaryLabel?: string
    secondaryAction?: () => void
    primaryLabel?: string
    /** Replaces Joyride's own advance, for a step whose primary leaves the tour. */
    primaryAction?: () => void
    brand?: boolean
    variant?: 'invoker'
}

export function OnboardingTooltip({ backProps, closeProps, continuous, index, primaryProps, step, tooltipProps }: TooltipRenderProps) {
    const { t } = useI18n('onboarding')
    const data = (step.data ?? {}) as OnboardingTooltipData
    const kind = data.kind ?? 'info'
    const isFirst = index === 0
    const isLast = index === data.total - 1
    // Leaving mid-tour lives on this icon now. The first step keeps its own
    // worded opt-out, and the last one needs nothing beyond Finish.
    const canClose = !isFirst && !isLast
    const close = closeProps.onClick as unknown as () => void

    return (
        <section {...tooltipProps} className={`onboarding-tooltip onboarding-tooltip--${kind}${data.brand ? ' onboarding-tooltip--welcome' : ''}${data.variant ? ` onboarding-tooltip--${data.variant}` : ''}`} aria-label={data.kicker}>
            <header className="onboarding-tooltip__header">
                <div className="onboarding-tooltip__eyebrow">
                    {data.brand && <span className="onboarding-tooltip__brand" aria-hidden>OC</span>}
                    <span>{data.kicker}</span>
                </div>
                <div className="onboarding-tooltip__header-end">
                    <span className="onboarding-tooltip__counter">{t('progress.counter', { current: index + 1, total: data.total })}</span>
                    {canClose && (
                        <Tooltip content={t('actions.close')}>
                            <IconButton
                                type="text"
                                size="sm"
                                iconProps={{ name: 'close', size: 14 }}
                                onClick={close}
                                testId="onboarding-tour-close"
                            />
                        </Tooltip>
                    )}
                </div>
            </header>
            {step.title && <h2 className="onboarding-tooltip__title">{step.title}</h2>}
            <div className="onboarding-tooltip__content">{step.content}</div>
            <footer className="onboarding-tooltip__footer">
                <span className="onboarding-tooltip__note">{data.footerNote}</span>
                <div className="onboarding-tooltip__actions">
                    {!isFirst && (
                        <Button type="default" onClick={backProps.onClick as unknown as () => void} testId="onboarding-tour-back">
                            {t('actions.back')}
                        </Button>
                    )}
                    {data.secondaryLabel && (
                        <Button type="default" onClick={data.secondaryAction ?? close} testId="onboarding-tour-secondary">
                            {data.secondaryLabel}
                        </Button>
                    )}
                    {continuous && (
                        <Button type="primary" onClick={data.primaryAction ?? (primaryProps.onClick as unknown as () => void)} testId="onboarding-tour-primary">
                            {data.primaryLabel ?? (isLast ? t('actions.finish') : t('actions.next'))}
                        </Button>
                    )}
                </div>
            </footer>
        </section>
    )
}
