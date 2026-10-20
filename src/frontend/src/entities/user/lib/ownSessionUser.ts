import {store} from '@app/store/store'
import {apiExecutor} from '@shared/api/apiExecutor'
import {authActions} from '@entities/auth/model/authSlice'
import {selectAuthSession} from '@entities/auth/model/authSelectors'
import type {AuthUser} from '@entities/auth/model/types'
import type {User} from '@entities/user/model/types'
import {extractNormalizedUser} from '@features/auth/utils'

export const isErrorResult = (result: unknown) =>
    !!result && typeof result === 'object' && ('status' in result || 'error' in result)

const isSessionUser = (userId: number) => selectAuthSession(store.getState())?.user.userId === userId

/**
 * Re-reads the signed-in user into the session after their own record changed outside
 * the auth flow, so the top bar, the user-actions menu and the policy context stop
 * showing the old name, picture or permissions. Anyone else's id is a no-op.
 */
export async function syncOwnSessionUser(userId: number): Promise<void> {
    if (!isSessionUser(userId)) return

    const fetched = (await apiExecutor({url: `/user/${userId}`, method: 'GET'})) as AuthUser
    if (isErrorResult(fetched)) return

    // Read again after the await: a logout or re-login in the meantime must not be overwritten.
    const session = selectAuthSession(store.getState())
    if (!session || session.user.userId !== userId) return
    store.dispatch(authActions.setSession({
        ...session,
        user: fetched,
        normalizedUser: extractNormalizedUser(fetched),
    }))
}

type SavedUserCtx = {
    payload?: {userId?: number}
    response?: Partial<User>
}

const resolveSavedUserId = (ctx: SavedUserCtx): number | undefined =>
    ctx.response?.userId ?? ctx.payload?.userId

/** Wizard after-save condition: the saved record is the signed-in user's own. */
export const isOwnSavedUser = (ctx: SavedUserCtx) => {
    const userId = resolveSavedUserId(ctx)
    return typeof userId === 'number' && isSessionUser(userId)
}

/** Wizard after-save action; runs last so it reads back the picture changes made before it. */
export async function syncOwnSavedUser(ctx: SavedUserCtx): Promise<void> {
    const userId = resolveSavedUserId(ctx)
    if (typeof userId === 'number') await syncOwnSessionUser(userId)
}
