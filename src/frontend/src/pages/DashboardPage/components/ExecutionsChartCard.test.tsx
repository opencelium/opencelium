import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import type {Series} from './MiniLineChart'
import type {DayOfWeek, ExecutionsTimelinePoint} from '../api/dashboardWidgetApi'

// Shared mutable holders, hoisted so the vi.mock factories below can read them.
const mocks = vi.hoisted(() => ({
    query: vi.fn(),
    refetch: vi.fn(),
    series: null as Series[] | null,
}))

// Identity translator + fixed language so weekday labels are deterministic.
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))

vi.mock('../api/dashboardWidgetApi', () => ({
    useGetExecutionsTimelineQuery: () => mocks.query(),
}))

// Provider-free primitive stand-ins (the real ones need SystemProvider).
vi.mock('@shared/ui/primitives/Card', () => ({
    Card: ({title, extra, children}: {title?: ReactNode; extra?: ReactNode; children?: ReactNode}) => (
        <section>
            <div data-testid="card-title">{title}</div>
            <div data-testid="card-extra">{extra}</div>
            <div>{children}</div>
        </section>
    ),
}))
vi.mock('@shared/ui/primitives/Typography', () => ({
    Typography: ({children}: {children?: ReactNode}) => <span>{children}</span>,
}))
vi.mock('@shared/ui/primitives/Loading/Loading', () => ({
    Loading: () => <div data-testid="loading" />,
}))
vi.mock('@shared/ui/primitives/Loading/LoadingOverlay', () => ({
    LoadingOverlay: ({loading, children}: {loading?: boolean; children?: ReactNode}) => (
        <div data-testid="loading-overlay" data-loading={String(!!loading)}>{children}</div>
    ),
}))
vi.mock('@shared/ui/primitives/Empty', () => ({
    Empty: () => <div data-testid="empty" />,
}))

// Capture the series instead of rendering SVG (MiniLineChart needs ResizeObserver).
vi.mock('./MiniLineChart', () => ({
    MiniLineChart: ({series}: {series: Series[]}) => {
        mocks.series = series
        return <div data-testid="mini-line-chart" />
    },
}))
vi.mock('./RefreshButton', () => ({
    RefreshButton: ({onClick, loading}: {onClick: () => void; loading?: boolean; testId?: string}) => (
        <button data-testid="refresh" data-loading={String(!!loading)} onClick={onClick} />
    ),
}))

import {ExecutionsChartCard} from './ExecutionsChartCard'

type QueryState = {
    data?: {points: ExecutionsTimelinePoint[]}
    isLoading: boolean
    isFetching: boolean
    refetch: () => void
}

function setQuery(overrides: Partial<QueryState> = {}) {
    mocks.query.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        refetch: mocks.refetch,
        ...overrides,
    } satisfies QueryState)
}

function point(
    overrides: Partial<ExecutionsTimelinePoint> & {dayOfWeek: DayOfWeek},
): ExecutionsTimelinePoint {
    return {date: null, executions: 0, failures: 0, ...overrides}
}

beforeEach(() => {
    mocks.query.mockReset()
    mocks.refetch.mockReset()
    mocks.series = null
    setQuery()
})

describe('ExecutionsChartCard', () => {
    it('renders the card title', () => {
        render(<ExecutionsChartCard />)
        expect(screen.getByTestId('card-title')).toHaveTextContent('executionsChart.title')
    })

    it('shows the loading spinner during the initial load and not the chart', () => {
        setQuery({isLoading: true})
        render(<ExecutionsChartCard />)
        expect(screen.getByTestId('loading')).toBeInTheDocument()
        expect(screen.queryByTestId('mini-line-chart')).not.toBeInTheDocument()
        expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    it('shows the empty state when the timeline has no points', () => {
        setQuery({data: {points: []}})
        render(<ExecutionsChartCard />)
        expect(screen.getByTestId('empty')).toBeInTheDocument()
        expect(screen.queryByTestId('mini-line-chart')).not.toBeInTheDocument()
    })

    it('builds an executions series and a failures series from the points', () => {
        setQuery({
            data: {
                points: [
                    point({dayOfWeek: 'MONDAY', executions: 10, failures: 2}),
                    point({dayOfWeek: 'TUESDAY', executions: 7, failures: 0}),
                ],
            },
        })
        render(<ExecutionsChartCard />)

        expect(screen.getByTestId('mini-line-chart')).toBeInTheDocument()
        const series = mocks.series
        expect(series).not.toBeNull()
        expect(series!.map((s) => s.key)).toEqual(['executions', 'failures'])
        expect(series![0].points.map((p) => p.value)).toEqual([10, 7])
        expect(series![1].points.map((p) => p.value)).toEqual([2, 0])
        // Both legends render alongside the chart.
        expect(screen.getByText('executionsChart.executions')).toBeInTheDocument()
        expect(screen.getByText('executionsChart.failures')).toBeInTheDocument()
    })

    it('labels each point with the localized short weekday', () => {
        setQuery({
            data: {points: [point({dayOfWeek: 'MONDAY'}), point({dayOfWeek: 'SUNDAY'})]},
        })
        render(<ExecutionsChartCard />)
        expect(mocks.series![0].points.map((p) => p.label)).toEqual(['Mon', 'Sun'])
    })

    it('reflects the fetching state on both the overlay and the refresh button', () => {
        setQuery({
            data: {points: [point({dayOfWeek: 'MONDAY', executions: 1, failures: 0})]},
            isFetching: true,
        })
        render(<ExecutionsChartCard />)
        expect(screen.getByTestId('loading-overlay')).toHaveAttribute('data-loading', 'true')
        expect(screen.getByTestId('refresh')).toHaveAttribute('data-loading', 'true')
    })

    it('refetches when the refresh button is clicked', () => {
        render(<ExecutionsChartCard />)
        fireEvent.click(screen.getByTestId('refresh'))
        expect(mocks.refetch).toHaveBeenCalledTimes(1)
    })
})
