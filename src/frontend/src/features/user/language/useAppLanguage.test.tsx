import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { AuthSession } from '@entities/auth/model/types'

let currentLang = 'en'
const setLang = vi.fn(async (next: string) => {
    currentLang = next
})
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key, lang: currentLang, setLang }),
}))

let session: AuthSession | null = null
const dispatch = vi.fn()
vi.mock('@shared/lib/storeHooks', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: () => session,
}))

vi.mock('@entities/auth/model/authSelectors', () => ({
    selectAuthSession: () => session,
}))

vi.mock('@entities/auth/model/authSlice', () => ({
    authActions: { setSession: (payload: unknown) => ({ type: 'auth/setSession', payload }) },
}))

const unwrap = vi.fn(async () => undefined)
const updateUser = vi.fn(() => ({ unwrap }))
vi.mock('@entities/user/api/userApi', () => ({
    useUpdateUserMutation: () => [updateUser, { isLoading: false }],
}))

const storeLanguage = vi.fn()
vi.mock('@shared/i18n/config/languageStorage', () => ({
    storeLanguage: (lang: string) => storeLanguage(lang),
}))

import { useAppLanguage } from './useAppLanguage'

const buildSession = (): AuthSession =>
    ({
        accessToken: 'token',
        user: {
            userId: 7,
            email: 'user@opencelium.io',
            username: null,
            totpEnabled: false,
            userGroup: { groupId: 3, name: 'Admin', description: null, icon: null, components: [] },
            userDetail: {
                name: 'Ada',
                surname: 'Lovelace',
                userTitle: null,
                phoneNumber: null,
                department: null,
                organization: null,
                profilePicture: null,
                appTour: false,
                theme: 'ci-dark',
                themeSync: false,
                lang: 'en',
                bitbucketUser: null,
                bitbucketPassword: null,
                requestTime: 0,
            },
            widgetSettings: [],
        },
        normalizedUser: { roles: [], permissions: [] },
    }) as unknown as AuthSession

beforeEach(() => {
    currentLang = 'en'
    session = null
    setLang.mockClear()
    dispatch.mockClear()
    updateUser.mockClear()
    unwrap.mockClear()
    storeLanguage.mockClear()
})

describe('useAppLanguage', () => {
    it('normalizes the reported language', () => {
        currentLang = 'de-DE'
        const { result } = renderHook(() => useAppLanguage())
        expect(result.current.lang).toBe('de')
    })

    it('switches and stores locally without a session, and persists nothing', async () => {
        const { result } = renderHook(() => useAppLanguage())

        await act(async () => { await result.current.changeLanguage('de') })

        expect(setLang).toHaveBeenCalledWith('de')
        expect(storeLanguage).toHaveBeenCalledWith('de')
        expect(updateUser).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('sends the whole user record so the full-replace PUT keeps group and details', async () => {
        session = buildSession()
        const { result } = renderHook(() => useAppLanguage())

        await act(async () => { await result.current.changeLanguage('de') })

        expect(updateUser).toHaveBeenCalledWith({
            userId: 7,
            body: {
                userId: 7,
                email: 'user@opencelium.io',
                userGroup: 3,
                userDetail: { ...session!.user.userDetail, lang: 'de' },
            },
        })
        // No password field: the backend keeps the stored hash only when it is absent.
        expect(Object.keys(updateUser.mock.calls[0][0].body)).not.toContain('password')
    })

    it('writes the new language into the session before the request', async () => {
        session = buildSession()
        const { result } = renderHook(() => useAppLanguage())

        await act(async () => { await result.current.changeLanguage('de') })

        const updated = dispatch.mock.calls[0][0].payload as AuthSession
        expect(updated.user.userDetail.lang).toBe('de')
        // The PUT response echoes a flattened request resource, so the session must
        // come from the local copy, not from the mutation result.
        expect(updated.user.userGroup).toEqual(session!.user.userGroup)
        expect(updated.user.widgetSettings).toEqual([])
    })

    it('keeps the language applied when persisting fails', async () => {
        session = buildSession()
        unwrap.mockRejectedValueOnce(new Error('500'))
        const { result } = renderHook(() => useAppLanguage())

        await act(async () => { await result.current.changeLanguage('de') })

        expect(currentLang).toBe('de')
        expect(storeLanguage).toHaveBeenCalledWith('de')
    })

    it('ignores a switch to the language already in use', async () => {
        session = buildSession()
        const { result } = renderHook(() => useAppLanguage())

        await act(async () => { await result.current.changeLanguage('en') })

        expect(setLang).not.toHaveBeenCalled()
        expect(updateUser).not.toHaveBeenCalled()
    })
})
