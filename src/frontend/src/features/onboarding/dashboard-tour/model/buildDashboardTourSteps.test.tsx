import {describe, expect, it, vi} from 'vitest'
import type {useI18n} from '@shared/i18n/hooks/useI18n'
import type {OnboardingTooltipData} from '../../ui/OnboardingTooltip'
import {buildDashboardTourSteps} from './buildDashboardTourSteps'
import {DASHBOARD_TOUR_STEPS, targetFor, type DashboardTourStepId} from './dashboardTourSteps'

const t = ((key: string) => key) as unknown as ReturnType<typeof useI18n<'onboarding'>>['t']
const ALL_IDS = DASHBOARD_TOUR_STEPS.map((step) => step.id)

const build = (presentIds: readonly DashboardTourStepId[], onDismiss = vi.fn()) =>
    buildDashboardTourSteps({t, presentIds, paletteKeyLabel: '⌘', onDismiss})

const dataOf = (step: {data?: unknown}) => step.data as OnboardingTooltipData

describe('buildDashboardTourSteps', () => {
    it('walks the page first, then the top bar', () => {
        const steps = build(ALL_IDS)
        expect(steps.map((step) => step.target)).toEqual([
            targetFor('header'),
            targetFor('tiles'),
            targetFor('executions'),
            targetFor('resources'),
            targetFor('connectors'),
            targetFor('comingSoon'),
            targetFor('createWorkflow'),
            targetFor('palette'),
            targetFor('language'),
            targetFor('help'),
            targetFor('menuSwitch'),
            targetFor('profile'),
        ])
        expect(steps.map((step) => step.title)).toEqual(
            ALL_IDS.map((id) => `dashboard.steps.${id}.title`),
        )
    })

    it('hands the platform modifier key to the palette copy', () => {
        const spy = vi.fn((key: string) => key)
        buildDashboardTourSteps({
            t: spy as unknown as typeof t,
            presentIds: ['palette'],
            paletteKeyLabel: '⌘',
            onDismiss: vi.fn(),
        })
        expect(spy).toHaveBeenCalledWith('dashboard.steps.palette.body', {key: '⌘'})
    })

    it('places the top-bar tooltips away from the viewport edges', () => {
        const steps = build(['createWorkflow', 'palette', 'profile'])
        expect(steps.map((step) => step.placement)).toEqual(['bottom-start', 'bottom', 'bottom-end'])
    })

    it('keeps the requested order regardless of how presentIds is ordered', () => {
        const steps = build(['comingSoon', 'header'])
        expect(steps.map((step) => step.target)).toEqual([targetFor('header'), targetFor('comingSoon')])
    })

    it('drops absent widgets and counts only what is left', () => {
        const steps = build(['header', 'tiles', 'executions'])
        expect(steps).toHaveLength(3)
        expect(steps.every((step) => dataOf(step).total === 3)).toBe(true)
    })

    it('gives every step the dashboard tooltip variant and its kicker', () => {
        const steps = build(ALL_IDS)
        expect(steps.every((step) => dataOf(step).variant === 'dashboard')).toBe(true)
        expect(steps.every((step) => dataOf(step).kicker === 'dashboard.kicker')).toBe(true)
    })

    it('puts the worded opt-out on the first step only, wired to onDismiss', () => {
        const onDismiss = vi.fn()
        const steps = build(ALL_IDS, onDismiss)

        expect(dataOf(steps[0]).secondaryLabel).toBe('actions.skipForNow')
        dataOf(steps[0]).secondaryAction?.()
        expect(onDismiss).toHaveBeenCalledTimes(1)

        expect(steps.slice(1).every((step) => dataOf(step).secondaryLabel === undefined)).toBe(true)
    })

    it('carries the palette hint first, then a note only where a step declares one', () => {
        const steps = build(ALL_IDS)
        // The first footer is the CommandHint element; the rest are plain strings.
        expect(typeof dataOf(steps[0]).footerNote).toBe('object')
        expect(dataOf(steps[2]).footerNote).toBe('dashboard.steps.executions.note')
        expect(dataOf(steps[1]).footerNote).toBeUndefined()
        expect(dataOf(steps[7]).footerNote).toBeUndefined()
    })

    it('opts every step out of the beacon so it opens on the widget directly', () => {
        expect(build(ALL_IDS).every((step) => step.disableBeacon === true)).toBe(true)
    })

    it('addresses anchors by data-testid', () => {
        expect(targetFor('executions')).toBe('[data-testid="dashboard-executions-card"]')
    })
})
