import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'

vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))

// Render WidgetCrash's leaf primitives without SystemProvider.
vi.mock('@shared/ui/primitives/Alert', () => ({
    Alert: ({message, description, action}: {message?: ReactNode; description?: ReactNode; action?: ReactNode}) => (
        <div data-testid="widget-crash">
            <div>{message}</div>
            <div>{description}</div>
            <div>{action}</div>
        </div>
    ),
}))
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({children, onClick, testId}: {children?: ReactNode; onClick?: () => void; testId?: string}) => (
        <button data-testid={testId} onClick={onClick}>{children}</button>
    ),
}))

import {DashboardCardBoundary} from './DashboardCardBoundary'

// A child whose throwing is controlled per-test, so we can simulate the
// Executions & Failures card crashing and then recovering on retry.
let shouldThrow = true
function FlakyCard() {
    if (shouldThrow) throw new Error('boom: Executions & Failures card crashed')
    return <div data-testid="card-content">chart</div>
}

describe('DashboardCardBoundary', () => {
    // React logs the caught render error to console.error; silence it for clean output.
    let errorSpy: ReturnType<typeof vi.spyOn>
    beforeAll(() => {
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterAll(() => {
        errorSpy.mockRestore()
    })
    beforeEach(() => {
        shouldThrow = true
    })
    afterEach(() => {
        errorSpy.mockClear()
    })

    it('renders the card normally when it does not throw', () => {
        shouldThrow = false
        render(
            <DashboardCardBoundary>
                <FlakyCard />
            </DashboardCardBoundary>,
        )
        expect(screen.getByTestId('card-content')).toBeInTheDocument()
        expect(screen.queryByTestId('widget-crash')).not.toBeInTheDocument()
    })

    it('shows the widget crash message when the card throws', () => {
        render(
            <DashboardCardBoundary>
                <FlakyCard />
            </DashboardCardBoundary>,
        )
        expect(screen.getByTestId('widget-crash')).toBeInTheDocument()
        expect(screen.getByText('errorBoundary.widget.title')).toBeInTheDocument()
        expect(screen.queryByTestId('card-content')).not.toBeInTheDocument()
    })

    it('contains the crash to the affected card and keeps sibling cards alive', () => {
        render(
            <>
                <DashboardCardBoundary>
                    <FlakyCard />
                </DashboardCardBoundary>
                <DashboardCardBoundary>
                    <div data-testid="healthy-card">other card</div>
                </DashboardCardBoundary>
            </>,
        )
        expect(screen.getByTestId('widget-crash')).toBeInTheDocument()
        // The sibling card rendered in its own boundary is unaffected.
        expect(screen.getByTestId('healthy-card')).toBeInTheDocument()
    })

    it('recovers the card when Try again is clicked after the error clears', () => {
        render(
            <DashboardCardBoundary>
                <FlakyCard />
            </DashboardCardBoundary>,
        )
        expect(screen.getByTestId('widget-crash')).toBeInTheDocument()

        // The underlying cause is resolved, then the user clicks retry.
        shouldThrow = false
        fireEvent.click(screen.getByTestId('crash-widget-retry'))

        expect(screen.getByTestId('card-content')).toBeInTheDocument()
        expect(screen.queryByTestId('widget-crash')).not.toBeInTheDocument()
    })
})
