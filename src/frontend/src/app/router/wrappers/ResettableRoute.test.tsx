import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { describe, expect, it } from 'vitest'
import ResettableRoute from './ResettableRoute'

/**
 * The workflow tutorial clears its canvas by re-navigating to the route it is already
 * on, relying on this wrapper to remount the subtree and drop the editor's graph
 * state. That only works because react-router mints a fresh `location.key` even for a
 * same-path navigation — an external behaviour worth pinning, since losing it would
 * make the tutorial silently leave invented connectors on a now-savable canvas.
 */
describe('ResettableRoute', () => {
    const renderProbe = (replace: boolean) => {
        let mounts = 0
        function Child() {
            const navigate = useNavigate()
            const navigated = useRef(false)
            useEffect(() => { mounts += 1 }, [])
            return (
                <button onClick={() => {
                    if (navigated.current) return
                    navigated.current = true
                    navigate('/workflow/create', { replace })
                }}>go</button>
            )
        }
        const view = render(
            <MemoryRouter initialEntries={['/workflow/create']}>
                <Routes>
                    <Route path="/workflow/create" element={<ResettableRoute><Child /></ResettableRoute>} />
                </Routes>
            </MemoryRouter>,
        )
        return { view, mounts: () => mounts }
    }

    it('remounts the subtree on a same-path replace', async () => {
        const probe = renderProbe(true)
        expect(probe.mounts()).toBe(1)
        fireEvent.click(probe.view.getByText('go'))
        await waitFor(() => expect(probe.mounts()).toBe(2))
        probe.view.unmount()
    })

    it('remounts the subtree on a same-path push too', async () => {
        const probe = renderProbe(false)
        fireEvent.click(probe.view.getByText('go'))
        await waitFor(() => expect(probe.mounts()).toBe(2))
        probe.view.unmount()
    })
})
