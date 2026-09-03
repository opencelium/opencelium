import type { TooltipRenderProps } from 'react-joyride'
import type { ReactNode } from 'react'
import type { OnboardingStepKind } from '../model/types'
import './onboardingTooltip.css'
import { useI18n } from '@shared/i18n/hooks/useI18n'

export type OnboardingTooltipData = {
    kicker: string
    kind?: OnboardingStepKind
    total?: number
    badge?: string
    footerNote?: ReactNode
    secondaryLabel?: string
    secondaryAction?: () => void
    primaryDisabled?: boolean
    primaryLabel?: string
    primaryAction?: () => void | Promise<void>
    hideBack?: boolean
    hideSecondary?: boolean
    brand?: boolean
    hideHeader?: boolean
    hideAccent?: boolean
    variant?: 'invoker' | 'created'
}

export function OnboardingTooltip({ backProps, closeProps, continuous, index, primaryProps, step, tooltipProps }: TooltipRenderProps) {
    const { t } = useI18n('onboarding')
    const data = (step.data ?? {}) as OnboardingTooltipData
    const kind = data.kind ?? 'info'

    return (
        <section {...tooltipProps} className={`onboarding-tooltip onboarding-tooltip--${kind}${data.brand ? ' onboarding-tooltip--welcome' : ''}${data.variant ? ` onboarding-tooltip--${data.variant}` : ''}`} aria-label={data.kicker}>
            {!data.hideAccent && <div className="onboarding-tooltip__accent" />}
            {!data.hideHeader && <header className="onboarding-tooltip__header">
                <div className="onboarding-tooltip__eyebrow">
                    {data.brand && <span className="onboarding-tooltip__brand" aria-hidden>OC</span>}
                    <span>{data.kicker}</span>
                    {data.badge && <span className="onboarding-tooltip__badge">{data.badge}</span>}
                </div>
                <span className="onboarding-tooltip__counter">{index + 1} of {data.total ?? 8}</span>
            </header>}
            {step.title && <h2 className="onboarding-tooltip__title">{step.title}</h2>}
            <div className="onboarding-tooltip__content">{step.content}</div>
            <footer className="onboarding-tooltip__footer">
                <span className="onboarding-tooltip__note">{data.footerNote}</span>
                <div className="onboarding-tooltip__actions">
                    {index > 0 && !data.hideBack && (
                        <button {...backProps} type="button" className="onboarding-tooltip__button">
                            {t('actions.back')}
                        </button>
                    )}
                    {!data.hideSecondary && (
                        <button
                            {...closeProps}
                            type="button"
                            className="onboarding-tooltip__button"
                            onClick={data.secondaryAction ?? closeProps.onClick}
                        >
                            {data.secondaryLabel ?? t('actions.skipTour')}
                        </button>
                    )}
                    {continuous && (
                        <button {...primaryProps} type="button" autoFocus={index === 0} disabled={data.primaryDisabled} onClick={data.primaryAction ?? primaryProps.onClick} className="onboarding-tooltip__button onboarding-tooltip__button--primary">
                            {data.primaryLabel ?? (primaryProps.title === 'Last' ? t('actions.finish') : t('actions.next'))}
                        </button>
                    )}
                </div>
            </footer>
        </section>
    )
}
