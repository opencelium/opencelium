import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {AuthSession, AuthUser} from '@entities/auth/model/types'

const mocks = vi.hoisted(() => ({
    state: {auth: {session: null as AuthSession | null}},
    dispatch: vi.fn(),
    apiExecutor: vi.fn(),
}))

vi.mock('@app/store/store', () => ({
    store: {getState: () => mocks.state, dispatch: mocks.dispatch},
}))
vi.mock('@shared/api/apiExecutor', () => ({apiExecutor: mocks.apiExecutor}))

import {isOwnSavedUser, syncOwnSavedUser, syncOwnSessionUser} from './ownSessionUser'

const buildUser = (name: string, groupName = 'admin'): AuthUser => ({
    userId: 1,
    email: 'admin@opencelium.io',
    username: 'admin',
    totpEnabled: false,
    userGroup: {
        groupId: 1,
        name: groupName,
        description: null,
        icon: null,
        components: [{componentId: 1, name: 'USER', permissions: ['READ']}],
    },
    userDetail: {name, surname: 'Admin'} as AuthUser['userDetail'],
    widgetSettings: [],
})

beforeEach(() => {
    mocks.state.auth.session = {
        accessToken: 'token',
        user: buildUser('Old'),
        normalizedUser: {roles: ['admin'], permissions: ['USER.READ']},
    }
    mocks.dispatch.mockReset()
    mocks.apiExecutor.mockReset()
})

describe('syncOwnSessionUser', () => {
    it('replaces the session user and its permissions with the fetched record', async () => {
        mocks.apiExecutor.mockResolvedValue(buildUser('New', 'support'))

        await syncOwnSessionUser(1)

        expect(mocks.apiExecutor).toHaveBeenCalledWith({url: '/user/1', method: 'GET'})
        const action = mocks.dispatch.mock.calls[0][0]
        expect(action.payload.accessToken).toBe('token')
        expect(action.payload.user.userDetail.name).toBe('New')
        expect(action.payload.normalizedUser).toEqual({roles: ['support'], permissions: ['USER.READ']})
    })

    it('leaves the session alone for another user', async () => {
        await syncOwnSessionUser(2)

        expect(mocks.apiExecutor).not.toHaveBeenCalled()
        expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('keeps the current session when the fetch fails', async () => {
        mocks.apiExecutor.mockResolvedValue({status: 500, data: null})

        await syncOwnSessionUser(1)

        expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('does not write over a session that ended while the fetch was in flight', async () => {
        mocks.apiExecutor.mockImplementation(async () => {
            mocks.state.auth.session = null
            return buildUser('New')
        })

        await syncOwnSessionUser(1)

        expect(mocks.dispatch).not.toHaveBeenCalled()
    })
})

describe('wizard after-save action', () => {
    it('runs only for the signed-in user, read from the response or the payload', () => {
        expect(isOwnSavedUser({response: {userId: 1}})).toBe(true)
        expect(isOwnSavedUser({payload: {userId: 1}})).toBe(true)
        expect(isOwnSavedUser({payload: {userId: 2}})).toBe(false)
        expect(isOwnSavedUser({})).toBe(false)
    })

    it('refreshes the session from the saved user id', async () => {
        mocks.apiExecutor.mockResolvedValue(buildUser('New'))

        await syncOwnSavedUser({payload: {userId: 1}})

        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
    })
})
