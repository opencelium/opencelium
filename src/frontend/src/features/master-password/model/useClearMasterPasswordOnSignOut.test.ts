import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

let isAuthenticated = true
vi.mock('@shared/lib/storeHooks', () => ({
    useAppSelector: () => isAuthenticated,
}))
vi.mock('@entities/auth/model/authSelectors', () => ({
    selectIsAuthenticated: () => isAuthenticated,
}))

import { useMasterPasswordStore } from './masterPasswordStore'
import { useClearMasterPasswordOnSignOut } from './useClearMasterPasswordOnSignOut'

describe('useClearMasterPasswordOnSignOut', () => {
    beforeEach(() => {
        isAuthenticated = true
        useMasterPasswordStore.getState().setMasterPassword('secret')
    })

    it('keeps the master password while the session lasts', () => {
        renderHook(() => useClearMasterPasswordOnSignOut())
        expect(useMasterPasswordStore.getState().masterPassword).toBe('secret')
    })

    it('clears the master password when the session ends', () => {
        const { rerender } = renderHook(() => useClearMasterPasswordOnSignOut())
        isAuthenticated = false
        rerender()
        expect(useMasterPasswordStore.getState().masterPassword).toBe('')
    })
})

describe('masterPasswordStore', () => {
    it('starts empty and does not read a legacy localStorage value', async () => {
        localStorage.setItem('masterPassword', 'leftover')
        vi.resetModules()
        const { useMasterPasswordStore: fresh } = await import('./masterPasswordStore')
        expect(fresh.getState().masterPassword).toBe('')
        expect(localStorage.getItem('masterPassword')).toBeNull()
    })
})
