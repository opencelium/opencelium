import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {act, render, screen} from '@testing-library/react'
import type {CallBackProps, Step} from 'react-joyride'
import {ACTIONS, EVENTS, STATUS} from 'react-joyride'
import {DASHBOARD_TOUR_STEPS, targetFor} from '../model/dashboardTourSteps'
import {POLL_MS} from '../model/useDashboardTourTargets'
import {useDashboardTourStore} from '../model/dashboardTour.store'
import {useOnboardingStore} from '../../model/onboarding.store'

const mocks = vi.hoisted(() => ({
    isAdmin: true,
    pathname: '/',
    joyride: null as {steps: Step[]; stepIndex: number; callback: (props: CallBackProps) => void} | null,
}))

vi.mock('@features/auth/useIsAdmin', () => ({useIsAdmin: () => mocks.isAdmin}))
vi.mock('@shared/theme/hooks/useTheme', () => ({useTheme: () => ({themeMode: 'light'})}))
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))
vi.mock('react-router-dom', () => ({useLocation: () => ({pathname: mocks.pathname})}))

// Joyride itself is not under test: capture what it is driven with instead of
// rendering a floater into jsdom.
vi.mock('react-joyride', () => ({
    ACTIONS: {CLOSE: 'close', NEXT: 'next', PREV: 'prev'},
    EVENTS: {STEP_AFTER: 'step:after', TARGET_NOT_FOUND: 'error:target_not_found'},
    STATUS: {FINISHED: 'finished', SKIPPED: 'skipped'},
    default: (props: {steps: Step[]; stepIndex: number; callback: (props: CallBackProps) => void}) => {
        mocks.joyride = props
        return <div data-testid="joyride" />
    },
}))

import {DashboardTour} from './DashboardTour'

/** Anchors the page would render, minus any the caller says are absent. */
function mountAnchors(absent: readonly string[] = []) {
    const PREFIX = '[data-testid="'
    for (const {id} of DASHBOARD_TOUR_STEPS) {
        if (absent.includes(id)) continue
        const el = document.createElement('div')
        // Read back out of the tour's own selector, so the fixture cannot drift.
        el.setAttribute('data-testid', targetFor(id).slice(PREFIX.length, -2))
        document.body.appendChild(el)
    }
}

/** The tour resolves its anchors off a timer, so every case has to advance one. */
const settle = () => act(() => {
    vi.advanceTimersByTime(POLL_MS)
})

/** The dashboard's own anchors, i.e. everything the top bar does not own. */
const PAGE_IDS = ['header', 'tiles', 'executions', 'resources', 'connectors', 'comingSoon']

beforeEach(() => {
    vi.useFakeTimers()
    mocks.isAdmin = true
    mocks.pathname = '/'
    mocks.joyride = null
    useDashboardTourStore.setState({requested: false})
    useOnboardingStore.setState({status: 'completed'})
})

afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
})

describe('DashboardTour', () => {
    it('stays inert until the tour is requested', () => {
        mountAnchors()
        render(<DashboardTour />)
        settle()
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()
    })

    it('runs for an admin who requested it on the dashboard', () => {
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()

        expect(screen.getByTestId('joyride')).toBeInTheDocument()
        expect(mocks.joyride?.steps).toHaveLength(DASHBOARD_TOUR_STEPS.length)
        expect(mocks.joyride?.stepIndex).toBe(0)
    })

    it('stays inert for a non-admin', () => {
        mocks.isAdmin = false
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()
    })

    it('stays inert off the dashboard route', () => {
        mocks.pathname = '/workflow'
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()
    })

    it('waits for the intro tour rather than stacking two backdrops', () => {
        mountAnchors()
        useOnboardingStore.setState({status: 'running'})
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()
        // The request still stands, so the tour opens once the intro is done.
        expect(useDashboardTourStore.getState().requested).toBe(true)
    })

    it('skips a widget that is not on the page', () => {
        mountAnchors(['resources', 'comingSoon'])
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()
        expect(mocks.joyride?.steps).toHaveLength(DASHBOARD_TOUR_STEPS.length - 2)
    })

    it('waits for anchors that have not rendered yet', () => {
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()

        // Same run, anchors arriving late: the next poll picks them up.
        mountAnchors()
        settle()
        expect(screen.getByTestId('joyride')).toBeInTheDocument()
    })

    it('waits for the page rather than opening on the top bar alone', () => {
        // The layout mounts the top bar before the route renders, so these anchors
        // exist first — the tour must not snapshot a chrome-only step list.
        mountAnchors(PAGE_IDS)
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()

        document.body.innerHTML = ''
        mountAnchors()
        settle()
        expect(mocks.joyride?.steps).toHaveLength(DASHBOARD_TOUR_STEPS.length)
    })

    it('advances and steps back through the callback', () => {
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()

        act(() => {
            mocks.joyride?.callback({
                action: ACTIONS.NEXT,
                index: 0,
                type: EVENTS.STEP_AFTER,
            } as CallBackProps)
        })
        expect(mocks.joyride?.stepIndex).toBe(1)

        act(() => {
            mocks.joyride?.callback({
                action: ACTIONS.PREV,
                index: 1,
                type: EVENTS.STEP_AFTER,
            } as CallBackProps)
        })
        expect(mocks.joyride?.stepIndex).toBe(0)
    })

    it('moves past a target that disappeared mid-tour', () => {
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()

        act(() => {
            mocks.joyride?.callback({
                action: ACTIONS.NEXT,
                index: 2,
                type: EVENTS.TARGET_NOT_FOUND,
            } as CallBackProps)
        })
        expect(mocks.joyride?.stepIndex).toBe(3)
    })

    it('clears the request when the tour is finished or closed', () => {
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        render(<DashboardTour />)
        settle()

        act(() => {
            mocks.joyride?.callback({
                action: ACTIONS.NEXT,
                index: 5,
                status: STATUS.FINISHED,
                type: EVENTS.STEP_AFTER,
            } as CallBackProps)
        })
        expect(useDashboardTourStore.getState().requested).toBe(false)
    })

    it('ends the run when the user navigates away', () => {
        mountAnchors()
        useDashboardTourStore.setState({requested: true})
        const {rerender} = render(<DashboardTour />)
        settle()
        expect(screen.getByTestId('joyride')).toBeInTheDocument()

        mocks.pathname = '/invoker'
        rerender(<DashboardTour />)

        expect(useDashboardTourStore.getState().requested).toBe(false)
        expect(screen.queryByTestId('joyride')).not.toBeInTheDocument()
    })
})
