import {beforeAll, describe, expect, it} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import {MiniLineChart, type Series} from './MiniLineChart'

// jsdom has no ResizeObserver and reports a zero-width layout, so the chart is
// pinned to 480px — the width the x-coordinates below are computed against.
beforeAll(() => {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 480,
    })
})

const series: Series[] = [
    {
        key: 'executions',
        color: 'blue',
        points: [
            {label: 'Mon', value: 10},
            {label: 'Tue', value: 20},
            {label: 'Wed', value: 30},
        ],
    },
    {
        key: 'failures',
        color: 'red',
        points: [
            {label: 'Mon', value: 1},
            {label: 'Tue', value: 2},
            {label: 'Wed', value: 3},
        ],
    },
]

// Chart-local x of point i: 40 (left padding) + i * (480 - 40 - 12) / 2
const xOfPoint = (index: number) => 40 + index * ((480 - 40 - 12) / 2)

function renderChart() {
    const view = render(
        <MiniLineChart
            series={series}
            testId="chart"
            renderTooltip={(index) => <span>tooltip-{index}</span>}
        />,
    )
    return {...view, plot: view.container.firstChild as HTMLElement}
}

describe('MiniLineChart hover tooltip', () => {
    it('shows no tooltip until the pointer enters the plot', () => {
        renderChart()
        expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })

    it('renders the tooltip for the nearest point under the pointer', () => {
        const {plot} = renderChart()

        fireEvent.mouseMove(plot, {clientX: xOfPoint(1)})
        expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('tooltip-1')

        fireEvent.mouseMove(plot, {clientX: xOfPoint(2) - 10})
        expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('tooltip-2')
    })

    it('clamps the hovered index to the plot bounds', () => {
        const {plot} = renderChart()

        fireEvent.mouseMove(plot, {clientX: 0})
        expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('tooltip-0')

        fireEvent.mouseMove(plot, {clientX: 10_000})
        expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('tooltip-2')
    })

    it('hides the tooltip when the pointer leaves', () => {
        const {plot} = renderChart()

        fireEvent.mouseMove(plot, {clientX: xOfPoint(1)})
        expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()

        fireEvent.mouseLeave(plot)
        expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })

    it('stays inert without renderTooltip', () => {
        const {container} = render(<MiniLineChart series={series} testId="chart" />)
        fireEvent.mouseMove(container.firstChild as HTMLElement, {clientX: xOfPoint(1)})
        expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })
})
