import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUnsavedChangesGuard } from '@features/workflow/hooks/useUnsavedChangesGuard'

vi.mock('@features/auth/useIsAdmin', () => ({ useIsAdmin: () => true }))
// The dim picks its colour from the active theme; the provider is not what this
// scenario is about.
vi.mock('@shared/theme/hooks/useTheme', () => ({ useTheme: () => ({ themeMode: 'light' }) }))
vi.mock('./TutorialSpotlight', () => ({ TutorialSpotlight: () => null }))
vi.mock('./TutorialPill', () => ({
    TutorialPill: ({ onClose }: { onClose: () => void }) =>
        <button data-testid="close" onClick={onClose}>close</button>,
}))

import { useWorkflowTutorialStore } from '../model/workflowTutorial.store'
import { WorkflowTutorial } from './WorkflowTutorial'

const MESSAGE = 'You have unsaved changes that will be lost.'

/** Stands in for the editor: unsaved changes present, so the guard is armed. */
const Guarded = () => {
    useUnsavedChangesGuard(true, MESSAGE)
    const navigate = useNavigate()
    return (
        <>
            <span data-testid="location-key">{useLocation().key}</span>
            <button data-testid="plain-navigate" onClick={() => navigate('/workflow/create', { replace: true })}>
                go
            </button>
        </>
    )
}

const renderBoth = () =>
    render(
        <MemoryRouter initialEntries={['/workflow/create']}>
            <Routes>
                <Route path="/workflow/create" element={<><Guarded /><WorkflowTutorial /></>} />
            </Routes>
        </MemoryRouter>,
    )

describe('finishing the tutorial past the unsaved-changes guard', () => {
    beforeEach(() => {
        useWorkflowTutorialStore.setState({ requested: true })
        vi.spyOn(window, 'confirm').mockReturnValue(true)
    })
    afterEach(() => {
        useWorkflowTutorialStore.setState({ requested: false })
        vi.restoreAllMocks()
        document.body.innerHTML = ''
    })

    // The control: without this, a passing test below could just mean the guard was
    // never armed in the first place.
    it('still prompts for a navigation nobody opted out of', () => {
        const view = renderBoth()
        fireEvent.click(view.getByTestId('plain-navigate'))
        expect(window.confirm).toHaveBeenCalledWith(MESSAGE)
        view.unmount()
    })

    it('does not prompt when the tutorial resets its own canvas', async () => {
        const view = renderBoth()
        const before = view.getByTestId('location-key').textContent

        fireEvent.click(view.getByTestId('close'))

        expect(window.confirm).not.toHaveBeenCalled()
        // and the reset still happened
        await waitFor(() => expect(view.getByTestId('location-key').textContent).not.toBe(before))
        view.unmount()
    })

    it('leaves the guard armed afterwards', () => {
        const view = renderBoth()
        fireEvent.click(view.getByTestId('close'))
        expect(window.confirm).not.toHaveBeenCalled()

        fireEvent.click(view.getByTestId('plain-navigate'))
        expect(window.confirm).toHaveBeenCalledWith(MESSAGE)
        view.unmount()
    })
})
