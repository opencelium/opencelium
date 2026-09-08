import type { TooltipRenderProps } from 'react-joyride'
import type { ReactNode } from 'react'
import type { OnboardingStepKind } from '../model/types'
import './onboardingTooltip.css'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'

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
    hidePrimary?: boolean
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
                    {!data.hideBack && (
                        <Button type="default" onClick={backProps.onClick as unknown as () => void} disabled={index === 0}>
                            {t('actions.back')}
                        </Button>
                    )}
                    {!data.hideSecondary && (
                        <Button
                            type="default"
                            onClick={data.secondaryAction ?? (closeProps.onClick as unknown as () => void)}
                        >
                            {data.secondaryLabel ?? t('actions.skipTour')}
                        </Button>
                    )}
                    {continuous && !data.hidePrimary && (
                        <Button type="primary" disabled={data.primaryDisabled} onClick={data.primaryAction ?? (primaryProps.onClick as unknown as () => void)}>
                            {data.primaryLabel ?? (primaryProps.title === 'Last' ? t('actions.finish') : t('actions.next'))}
                        </Button>
                    )}
                </div>
            </footer>
        </section>
    )
}
