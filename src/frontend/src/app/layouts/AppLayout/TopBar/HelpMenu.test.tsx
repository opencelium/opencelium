import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import {cloneElement, isValidElement, type ReactElement, type ReactNode} from 'react'
import {useDashboardTourStore} from '@features/onboarding/dashboard-tour/model/dashboardTour.store'

const mocks = vi.hoisted(() => ({
    isAdmin: true,
    navigate: vi.fn(),
}))

vi.mock('@features/auth/useIsAdmin', () => ({useIsAdmin: () => mocks.isAdmin}))
vi.mock('react-router-dom', () => ({useNavigate: () => mocks.navigate}))
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))

// Provider-free stand-ins; the real primitives need SystemProvider.
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

/**
 * Reduced to the two things this component depends on: the controlled-open
 * contract, and the fact that antd hands the trigger's click to the *child* it
 * was given. Cloning the child rather than wrapping it is what makes the test
 * fail if the trigger ever goes back to a component that drops unknown props.
 */
vi.mock('antd', () => ({
    Popover: ({
        open,
        onOpenChange,
        content,
        children,
    }: {
        open?: boolean
        onOpenChange?: (next: boolean) => void
        content?: ReactNode
        children?: ReactNode
    }) => (
        <div>
            {isValidElement(children)
                ? cloneElement(children as ReactElement<{onClick?: () => void}>, {
                      onClick: () => onOpenChange?.(!open),
                  })
                : children}
            {open ? <div data-testid="popover-content">{content}</div> : null}
        </div>
    ),
}))

import {HelpMenu} from './HelpMenu'

/** Clicks what the user clicks: the icon itself, handler and all. */
const openMenu = () => fireEvent.click(screen.getByTestId('topbar-help'))

beforeEach(() => {
    mocks.isAdmin = true
    mocks.navigate.mockReset()
    useDashboardTourStore.setState({requested: false})
    vi.restoreAllMocks()
})

describe('HelpMenu', () => {
    it('renders the help trigger with the tour anchor on it', () => {
        render(<HelpMenu />)
        expect(screen.getByTestId('topbar-help')).toBeInTheDocument()
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument()
    })

    it('opens on a click of the icon, and closes on the next one', () => {
        render(<HelpMenu />)

        openMenu()
        expect(screen.getByTestId('popover-content')).toBeInTheDocument()

        openMenu()
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument()
    })

    it('offers the docs and the tour once opened', () => {
        render(<HelpMenu />)
        openMenu()
        expect(screen.getByTestId('topbar-docs')).toHaveTextContent('topbar.docs')
        expect(screen.getByTestId('topbar-start-tour')).toHaveTextContent('topbar.startTour')
    })

    it('lays both entries out on the same icon/label grid', () => {
        render(<HelpMenu />)
        openMenu()

        for (const testId of ['topbar-docs', 'topbar-start-tour']) {
            const row = screen.getByTestId(testId).querySelector('.topbar-help-menu__item')
            expect(row).not.toBeNull()
            // Icon first, then the label — the order the two-column grid expects.
            expect(row?.children).toHaveLength(2)
        }
        expect(screen.getByTestId('icon-docs')).toBeInTheDocument()
        expect(screen.getByTestId('icon-play')).toBeInTheDocument()
    })

    it('opens the documentation in a new tab and closes the menu', () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null)
        render(<HelpMenu />)
        openMenu()

        fireEvent.click(screen.getByTestId('topbar-docs'))

        expect(open).toHaveBeenCalledWith(
            'https://docs.opencelium.io/en/prod/',
            '_blank',
            'noopener,noreferrer',
        )
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument()
    })

    it('sends the user home and requests the tour, with the menu out of the way', () => {
        render(<HelpMenu />)
        openMenu()

        fireEvent.click(screen.getByTestId('topbar-start-tour'))

        expect(mocks.navigate).toHaveBeenCalledWith('/')
        expect(useDashboardTourStore.getState().requested).toBe(true)
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument()
    })

    it('hides the tour entry from a non-admin, who cannot run it', () => {
        mocks.isAdmin = false
        render(<HelpMenu />)
        openMenu()

        expect(screen.getByTestId('topbar-docs')).toBeInTheDocument()
        expect(screen.queryByTestId('topbar-start-tour')).not.toBeInTheDocument()
    })
})
