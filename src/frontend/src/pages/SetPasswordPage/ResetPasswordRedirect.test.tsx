import {describe, expect, it} from 'vitest'
import {render, screen} from '@testing-library/react'
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom'
import {ResetPasswordRedirect} from './ResetPasswordRedirect'

function Target() {
    const {pathname, search} = useLocation()
    return <span data-testid="target">{`${pathname}${search}`}</span>
}

describe('ResetPasswordRedirect', () => {
    it('forwards /reset-password to /set-password keeping the token', () => {
        render(
            <MemoryRouter initialEntries={['/reset-password?token=abc-123']}>
                <Routes>
                    <Route path="/reset-password" element={<ResetPasswordRedirect />} />
                    <Route path="/set-password" element={<Target />} />
                </Routes>
            </MemoryRouter>,
        )
        expect(screen.getByTestId('target')).toHaveTextContent('/set-password?token=abc-123')
    })
})
