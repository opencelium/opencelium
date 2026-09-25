import type { Step } from 'react-joyride'
import type { useI18n } from '@shared/i18n/hooks/useI18n'
import { CommandHint } from '../../ui/CommandHint'
import type { OnboardingTooltipData } from '../../ui/OnboardingTooltip'
import {
    DASHBOARD_TOUR_COMMAND,
    DASHBOARD_TOUR_STEPS,
    SPOTLIGHT_PADDING,
    targetFor,
    type DashboardTourStepId,
} from './dashboardTourSteps'

type BuildOptions = {
    t: ReturnType<typeof useI18n<'onboarding'>>['t']
    /** Steps whose widget is actually on the page. */
    presentIds: readonly DashboardTourStepId[]
    /** '⌘' or the translated 'Ctrl', interpolated into the palette step's copy. */
    paletteKeyLabel: string
    onDismiss: () => void
}

/**
 * Pure: which widgets exist is resolved by the host and passed in, so the step
 * list can be asserted without a DOM. A card that crashed into its boundary, or
 * one a release has not shipped yet, is simply absent from `presentIds` — the
 * counter then reads over the steps that remain rather than promising six.
 */
export function buildDashboardTourSteps({ t, presentIds, paletteKeyLabel, onDismiss }: BuildOptions): Step[] {
    const steps = DASHBOARD_TOUR_STEPS.filter(step => presentIds.includes(step.id))

    return steps.map((step, index) => {
        const base = `dashboard.steps.${step.id}`
        const data: OnboardingTooltipData = {
            kicker: t('dashboard.kicker'),
            variant: 'dashboard',
            total: steps.length,
            // The first step has no close icon (see OnboardingTooltip), so it
            // carries the worded way out instead.
            ...(index === 0
                ? { secondaryLabel: t('actions.skipForNow'), secondaryAction: onDismiss }
                : {}),
            footerNote: index === 0
                ? <CommandHint command={DASHBOARD_TOUR_COMMAND} />
                : step.hasNote ? t(`${base}.note`) : undefined,
        }

        return {
            target: targetFor(step.id),
            placement: step.placement,
            disableBeacon: true,
            spotlightPadding: SPOTLIGHT_PADDING,
            title: t(`${base}.title`),
            // `key` is passed to every step; only the palette's copy interpolates it.
            content: <p>{t(`${base}.body`, { key: paletteKeyLabel })}</p>,
            data,
        }
    })
}
