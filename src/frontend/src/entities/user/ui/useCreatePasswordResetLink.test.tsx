import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, renderHook} from '@testing-library/react'

const mocks = vi.hoisted(() => ({
    generalRequest: vi.fn(),
    emit: vi.fn(),
    notifyError: vi.fn(),
    dispatch: vi.fn(),
    invalidateGeneric: vi.fn((tags: unknown) => ({kind: 'generic', tags})),
}))

vi.mock('@shared/api/genericApi', () => ({
    useGeneralRequestMutation: () => [mocks.generalRequest],
    genericApi: {util: {invalidateTags: mocks.invalidateGeneric}},
}))
vi.mock('@shared/lib/storeHooks', () => ({useAppDispatch: () => mocks.dispatch}))
vi.mock('@shared/errors/api/errorBus', () => ({errorBus: {emit: mocks.emit}}))
vi.mock('@shared/errors/api/normalizeError', () => ({
    normalizeError: (error: unknown) => ({type: 'NORMALIZED', error}),
}))
vi.mock('@shared/ui/feedback/notifyError', () => ({notifyError: mocks.notifyError}))
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))

import {useCreatePasswordResetLink} from './useCreatePasswordResetLink'

function respond(outcome: {ok: unknown} | {fail: unknown}) {
    mocks.generalRequest.mockReturnValue({
        unwrap: () => ('ok' in outcome ? Promise.resolve(outcome.ok) : Promise.reject(outcome.fail)),
    })
}

async function createFor(userId: number, sendEmail = false) {
    const {result} = renderHook(() => useCreatePasswordResetLink())
    let link: unknown
    await act(async () => {
        link = await result.current.create(userId, sendEmail)
    })
    return link
}

beforeEach(() => {
    mocks.generalRequest.mockReset()
    mocks.emit.mockReset()
    mocks.notifyError.mockReset()
    mocks.dispatch.mockReset()
})

describe('useCreatePasswordResetLink', () => {
    it('posts to the user endpoint without invalidating the entity cache and returns the link', async () => {
        const dto = {link: 'https://oc.example.com/set-password?token=tok', expiresAt: '2026-11-26T10:00:00Z'}
        respond({ok: dto})

        expect(await createFor(7, true)).toEqual(dto)
        expect(mocks.generalRequest).toHaveBeenCalledWith({
            url: '/user/7/password-link?sendEmail=true',
            method: 'POST',
            options: {ignoreError: true, skipEntityInvalidation: true},
        })
        expect(mocks.notifyError).not.toHaveBeenCalled()
    })

    it('explains an LDAP account itself', async () => {
        respond({fail: {status: 400, data: {error: 'PASSWORD_MANAGED_EXTERNALLY'}}})
        expect(await createFor(7)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.ldapAccount')
        expect(mocks.emit).not.toHaveBeenCalled()
        expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('explains a failed email itself instead of the error bus', async () => {
        respond({fail: {status: 503, data: {error: 'EMAIL_RECOVERY_FAILED'}}})
        expect(await createFor(7, true)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.emailFailed')
        expect(mocks.emit).not.toHaveBeenCalled()
    })

    it('refreshes the user list when the user no longer exists', async () => {
        respond({fail: {status: 404, data: {error: 'USER_NOT_EXIST'}}})
        expect(await createFor(7)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.userNotFound')
        expect(mocks.dispatch).toHaveBeenCalledWith({kind: 'generic', tags: ['Entity']})
    })

    it('routes auth failures through the error bus so session expiry still works', async () => {
        const fail = {status: 401, data: null}
        respond({fail})
        expect(await createFor(7)).toBeNull()
        expect(mocks.emit).toHaveBeenCalledWith({type: 'NORMALIZED', error: fail})
        expect(mocks.notifyError).not.toHaveBeenCalled()
    })

    it('names the missing base-url when the backend returns a null-prefixed link', async () => {
        respond({ok: {link: 'null?token=abc', expiresAt: '2026-11-26T10:00:00Z'}})
        expect(await createFor(7)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.baseUrlMissing')
    })

    it('rejects an unexpected success body', async () => {
        respond({ok: {message: 'done'}})
        expect(await createFor(7)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.failed')
    })
})
