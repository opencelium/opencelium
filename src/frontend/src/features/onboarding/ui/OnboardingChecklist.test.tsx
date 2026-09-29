import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ONBOARDING_RESTART_EVENT } from '../model/types'

vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}))
vi.mock('@shared/ui/confirm/ConfirmDialogContext', () => ({
    useConfirm: () => vi.fn().mockResolvedValue(false),
}))
// Provider-free stand-ins; the real primitives need SystemProvider and contribute
// nothing to whether the checklist opens, closes or restarts.
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({ children, onClick, testId }: { children?: ReactNode; onClick?: () => void; testId?: string }) => (
        <button data-testid={testId} onClick={onClick}>{children}</button>
    ),
}))
vi.mock('@shared/ui/primitives/Icon', () => ({
    Icon: ({ name }: { name: string }) => <i data-testid={`icon-${name}`} />,
}))

import { OnboardingChecklist } from './OnboardingChecklist'

const renderChecklist = (over: Partial<Parameters<typeof OnboardingChecklist>[0]> = {}) => {
    const onResume = vi.fn()
    const onRestart = vi.fn()
    const onDismiss = vi.fn()
    const view = render(
        <OnboardingChecklist
            stepId="welcome"
            status="running"
            onResume={onResume}
            onRestart={onRestart}
            onDismiss={onDismiss}
            hasInvokers={false}
            {...over}
        />,
    )
    return { view, onResume, onRestart, onDismiss }
}

const open = () => fireEvent.click(screen.getByTestId('onboarding-checklist-open'))

describe('OnboardingChecklist', () => {
    it('opens collapsed, as a pill', () => {
        renderChecklist()
        expect(screen.getByTestId('onboarding-checklist-open')).toBeInTheDocument()
        expect(screen.queryByTestId('onboarding-checklist-restart')).not.toBeInTheDocument()
    })

    it('expands on a click of the pill', () => {
        renderChecklist()
        open()
        expect(screen.getByTestId('onboarding-checklist-restart')).toBeInTheDocument()
    })

    // Restarting hands the panel back a fresh, first-step tour — a checklist left
    // open over it would be fighting the tour for the same screen space.
    it('collapses back to the pill when its own Restart is pressed', () => {
        const { onRestart } = renderChecklist()
        open()

        fireEvent.click(screen.getByTestId('onboarding-checklist-restart'))

        expect(onRestart).toHaveBeenCalledOnce()
        expect(screen.getByTestId('onboarding-checklist-open')).toBeInTheDocument()
        expect(screen.queryByTestId('onboarding-checklist-restart')).not.toBeInTheDocument()
    })

    // Restart can also arrive from the command palette's "help onboarding", which
    // has no reference to this component's local state — only the shared event.
    it('collapses back to the pill when restart is requested from elsewhere', () => {
        renderChecklist()
        open()
        expect(screen.getByTestId('onboarding-checklist-restart')).toBeInTheDocument()

        act(() => {
            window.dispatchEvent(new Event(ONBOARDING_RESTART_EVENT))
        })

        expect(screen.getByTestId('onboarding-checklist-open')).toBeInTheDocument()
        expect(screen.queryByTestId('onboarding-checklist-restart')).not.toBeInTheDocument()
    })
})
