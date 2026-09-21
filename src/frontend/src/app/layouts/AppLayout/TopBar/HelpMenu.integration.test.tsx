import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {useDashboardTourStore} from '@features/onboarding/dashboard-tour/model/dashboardTour.store'

const mocks = vi.hoisted(() => ({navigate: vi.fn()}))

vi.mock('@features/auth/useIsAdmin', () => ({useIsAdmin: () => true}))
vi.mock('react-router-dom', () => ({useNavigate: () => mocks.navigate}))
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))

// Stand-ins with the same *closed* prop sets as the real primitives, so anything
// antd injects into the trigger is dropped here exactly as it is in the app. antd
// itself is deliberately NOT mocked: this asserts the real Popover can drive the
// real component tree, which a hand-written popover mock cannot tell us.
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({children, onClick, testId}: {children?: ReactNode; onClick?: () => void; testId?: string}) => (
        <button data-testid={testId} onClick={onClick}>{children}</button>
    ),
}))
vi.mock('@shared/ui/primitives/IconButton', () => ({
    IconButton: ({testId}: {testId?: string}) => <button data-testid={testId} />,
}))
vi.mock('@shared/ui/primitives/Icon', () => ({
    Icon: ({name}: {name: string}) => <i data-testid={`icon-${name}`} />,
}))
vi.mock('@shared/ui/primitives/Tooltip', () => ({
    Tooltip: ({children}: {children?: ReactNode}) => <>{children}</>,
}))

import {HelpMenu} from './HelpMenu'

// antd's popup measures itself; jsdom has no ResizeObserver.
beforeAll(() => {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver
})

beforeEach(() => {
    mocks.navigate.mockReset()
    useDashboardTourStore.setState({requested: false})
})

describe('HelpMenu against the real antd Popover', () => {
    it('opens the menu when the help icon is clicked', async () => {
        render(<HelpMenu />)
        expect(screen.queryByTestId('topbar-start-onboarding-tour')).not.toBeInTheDocument()
        expect(screen.queryByTestId('topbar-start-dashboard-tour')).not.toBeInTheDocument()

        fireEvent.click(screen.getByTestId('topbar-help'))

        expect(await screen.findByTestId('topbar-docs')).toBeInTheDocument()
        expect(screen.getByTestId('topbar-start-onboarding-tour')).toBeInTheDocument()
        expect(screen.getByTestId('topbar-start-dashboard-tour')).toBeInTheDocument()
    })

    it('starts the dashboard tour from the menu', async () => {
        render(<HelpMenu />)
        fireEvent.click(screen.getByTestId('topbar-help'))
        fireEvent.click(await screen.findByTestId('topbar-start-dashboard-tour'))

        expect(mocks.navigate).toHaveBeenCalledWith('/')
        expect(useDashboardTourStore.getState().requested).toBe(true)
    })

    it('restarts the onboarding tour from the menu', async () => {
        const dispatchEvent = vi.spyOn(window, 'dispatchEvent')
        render(<HelpMenu />)
        fireEvent.click(screen.getByTestId('topbar-help'))
        fireEvent.click(await screen.findByTestId('topbar-start-onboarding-tour'))

        expect(mocks.navigate).toHaveBeenCalledWith('/')
        expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({type: 'opencelium:onboarding:restart'}))
    })
})
