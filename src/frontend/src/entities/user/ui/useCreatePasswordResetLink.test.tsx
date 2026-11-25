import {beforeEach, describe, expect, it, vi} from 'vitest'
import {act, renderHook} from '@testing-library/react'

const mocks = vi.hoisted(() => ({generalRequest: vi.fn(), emit: vi.fn(), notifyError: vi.fn()}))

vi.mock('@shared/api/genericApi', () => ({
    useGeneralRequestMutation: () => [mocks.generalRequest],
}))
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

async function createFor(userId: number) {
    const {result} = renderHook(() => useCreatePasswordResetLink())
    let link: unknown
    await act(async () => {
        link = await result.current.create(userId)
    })
    return link
}

beforeEach(() => {
    mocks.generalRequest.mockReset()
    mocks.emit.mockReset()
    mocks.notifyError.mockReset()
})

describe('useCreatePasswordResetLink', () => {
    it('posts to the user endpoint without invalidating the entity cache and returns the link', async () => {
        const dto = {token: 'tok', expiresAt: '2026-11-26T10:00:00Z'}
        respond({ok: dto})

        expect(await createFor(7)).toEqual(dto)
        expect(mocks.generalRequest).toHaveBeenCalledWith({
            url: '/user/7/password-reset-link',
            method: 'POST',
            options: {ignoreError: true, skipEntityInvalidation: true},
        })
        expect(mocks.notifyError).not.toHaveBeenCalled()
    })

    it('explains an LDAP account itself', async () => {
        respond({fail: {status: 400, data: {error: 'LDAP_ACCOUNT'}}})
        expect(await createFor(7)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.ldapAccount')
        expect(mocks.emit).not.toHaveBeenCalled()
    })

    it('routes auth failures through the error bus so session expiry still works', async () => {
        const fail = {status: 401, data: null}
        respond({fail})
        expect(await createFor(7)).toBeNull()
        expect(mocks.emit).toHaveBeenCalledWith({type: 'NORMALIZED', error: fail})
        expect(mocks.notifyError).not.toHaveBeenCalled()
    })

    it('rejects an unexpected success body', async () => {
        respond({ok: {message: 'done'}})
        expect(await createFor(7)).toBeNull()
        expect(mocks.notifyError).toHaveBeenCalledWith('user.resetLink.error.failed')
    })
})
