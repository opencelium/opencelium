import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@features/auth/useIsAdmin', () => ({ useIsAdmin: () => true }))
vi.mock('./TutorialSpotlight', () => ({ TutorialSpotlight: () => null }))
vi.mock('./TutorialPill', () => ({ TutorialPill: () => null }))

const themeMode = vi.hoisted(() => ({ current: 'light' as 'light' | 'dark' }))
vi.mock('@shared/theme/hooks/useTheme', () => ({
    useTheme: () => ({ themeMode: themeMode.current }),
}))

import { useWorkflowTutorialStore } from '../model/workflowTutorial.store'
import { WorkflowTutorial } from './WorkflowTutorial'

const renderTutorial = () =>
    render(
        <MemoryRouter initialEntries={['/workflow/create']}>
            <Routes>
                <Route path="/workflow/create" element={<WorkflowTutorial />} />
            </Routes>
        </MemoryRouter>,
    )

const hasDark = () => document.documentElement.classList.contains('workflow-tutorial-dark')

/*
 * The regression: the dim chose its colour from `:root:not([data-theme='light'])`, and
 * this app sets no theme attribute at all — `applyTheme` rewrites CSS custom properties
 * instead — so the selector matched permanently and a light-themed editor was dimmed
 * with the near-black overlay meant for dark mode.
 */
describe('WorkflowTutorial theme', () => {
    beforeEach(() => {
        themeMode.current = 'light'
        useWorkflowTutorialStore.setState({ requested: true })
    })
    afterEach(() => {
        useWorkflowTutorialStore.setState({ requested: false })
        document.documentElement.className = ''
    })

    it('leaves the dark overlay off in a light theme', () => {
        const view = renderTutorial()
        expect(document.documentElement.classList.contains('workflow-tutorial-active')).toBe(true)
        expect(hasDark()).toBe(false)
        view.unmount()
    })

    it('turns it on in a dark theme', () => {
        themeMode.current = 'dark'
        const view = renderTutorial()
        expect(hasDark()).toBe(true)
        view.unmount()
    })

    // Both classes go together: leaving the dark one behind would tint the next
    // tutorial, and leaving either behind keeps Save suppressed on a real workflow.
    it('takes both classes off again when the tutorial ends', () => {
        themeMode.current = 'dark'
        const view = renderTutorial()

        view.unmount()

        expect(document.documentElement.classList.contains('workflow-tutorial-active')).toBe(false)
        expect(hasDark()).toBe(false)
    })
})
