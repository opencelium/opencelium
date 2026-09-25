import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useAppLogoStore } from '@features/branding/appLogoStore'
import { SystemLogoSync } from '@features/branding/SystemLogoSync'

const LOGO_URL = './storage/files/9f1c.png'

let isAuthenticated = true
vi.mock('@features/auth/useAuth', () => ({
    useAuth: () => ({ isAuthenticated }),
}))

// The query result the component sees; a reference kept stable across renders, exactly
// as RTK Query keeps it while nothing refetches.
let queryResult: { data?: unknown; error?: unknown } = {}
vi.mock('@entities/systemSetting/api/systemSettingApi', () => ({
    useGetSystemSettingQuery: () => queryResult,
}))

const dto = (url: string) => ({ name: 'app_logo', value: { filename: 'x.png', url }, updatedAt: '' })

describe('SystemLogoSync', () => {
    beforeEach(() => {
        isAuthenticated = true
        queryResult = {}
        act(() => useAppLogoStore.getState().clearLogo())
    })

    it('applies the logo the server reports', () => {
        queryResult = { data: dto(LOGO_URL) }

        render(<SystemLogoSync />)

        expect(useAppLogoStore.getState().logoPath).toBe(LOGO_URL)
    })

    it('leaves a reset alone while the answer it just replaced is still cached', () => {
        // The admin's DELETE clears the store, but this component's query still holds the
        // pre-delete answer. Re-applying it here would put the removed logo straight back
        // — which is what made "reset to default" look like it did nothing.
        queryResult = { data: dto(LOGO_URL) }
        render(<SystemLogoSync />)

        act(() => useAppLogoStore.getState().clearLogo())

        expect(useAppLogoStore.getState().logoPath).toBeNull()
    })

    it('leaves a fresh upload alone for the same reason', () => {
        queryResult = { data: dto(LOGO_URL) }
        render(<SystemLogoSync />)

        act(() => useAppLogoStore.getState().setLogo('./storage/files/newer.png'))

        expect(useAppLogoStore.getState().logoPath).toBe('./storage/files/newer.png')
    })

    it('clears the logo when the setting is gone', () => {
        useAppLogoStore.getState().setLogo(LOGO_URL)
        queryResult = { error: { status: 404 } }

        render(<SystemLogoSync />)

        expect(useAppLogoStore.getState().logoPath).toBeNull()
    })

    it('keeps the cached logo when the request fails for any other reason', () => {
        useAppLogoStore.getState().setLogo(LOGO_URL)
        queryResult = { error: { status: 500 } }

        render(<SystemLogoSync />)

        expect(useAppLogoStore.getState().logoPath).toBe(LOGO_URL)
    })

    it('discards a value that is not a logo', () => {
        useAppLogoStore.getState().setLogo(LOGO_URL)
        queryResult = { data: { name: 'app_logo', value: { filename: 'x.png' }, updatedAt: '' } }

        render(<SystemLogoSync />)

        expect(useAppLogoStore.getState().logoPath).toBeNull()
    })
})
