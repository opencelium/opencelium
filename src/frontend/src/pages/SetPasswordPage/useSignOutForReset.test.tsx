import {beforeEach, describe, expect, it, vi} from 'vitest'
import {renderHook} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import type {ReactNode} from 'react'

const mocks = vi.hoisted(() => ({logout: vi.fn(), isAuthenticated: false}))

vi.mock('@features/auth/useAuth', () => ({
    useAuth: () => ({isAuthenticated: mocks.isAuthenticated, logout: mocks.logout}),
}))

import {useSignOutForReset} from './useSignOutForReset'

function renderAt(url: string) {
    const wrapper = ({children}: {children: ReactNode}) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    )
    return renderHook(() => useSignOutForReset(), {wrapper})
}

beforeEach(() => {
    mocks.logout.mockReset().mockResolvedValue(undefined)
    mocks.isAuthenticated = false
})

describe('useSignOutForReset', () => {
    it('is ready and does not sign out when nobody is signed in', () => {
        const {result} = renderAt('/set-password?token=abc')
        expect(result.current).toBe('ready')
        expect(mocks.logout).not.toHaveBeenCalled()
    })

    it('signs a signed-in user out once when a reset token is present', () => {
        mocks.isAuthenticated = true
        const {result, rerender} = renderAt('/set-password?token=abc')
        rerender()
        expect(result.current).toBe('signingOut')
        expect(mocks.logout).toHaveBeenCalledTimes(1)
    })

    it('leaves a signed-in user alone when there is no token', () => {
        mocks.isAuthenticated = true
        const {result} = renderAt('/set-password')
        expect(result.current).toBe('nothingToReset')
        expect(mocks.logout).not.toHaveBeenCalled()
    })
})
