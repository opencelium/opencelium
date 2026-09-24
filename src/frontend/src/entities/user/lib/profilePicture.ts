import {store} from '@app/store/store'
import {apiExecutor} from '@shared/api/apiExecutor'
import {isImageFile} from '@shared/utils/fileTypeGuards'
import type {Mode} from '@/engine/entity/EntityDefinition'
import {authActions} from '@entities/auth/model/authSlice'
import {selectAuthSession} from '@entities/auth/model/authSelectors'
import type {User, UserUpdateDto} from '@entities/user/model/types'

const isErrorResult = (result: unknown) =>
    !!result && typeof result === 'object' && ('status' in result || 'error' in result)

/**
 * The backend finds the user by email and replaces (deletes) any previous picture itself.
 * `apiExecutor` resolves with the error instead of rejecting, so a failure is rethrown
 * here for callers that report it.
 */
export async function uploadProfilePicture(file: File, email: string): Promise<void> {
    const body = new FormData()
    body.append('file', file)
    const result = await apiExecutor({
        url: `/storage/profilePicture?email=${encodeURIComponent(email)}`,
        method: 'POST',
        body,
    })
    if (isErrorResult(result)) throw new Error('Profile picture upload failed')
}

/** Clears the stored picture; the backend answers 204 even when none was set. */
export async function deleteProfilePicture(userId: number): Promise<void> {
    const result = await apiExecutor({url: `/user/${userId}/profilePicture`, method: 'DELETE'})
    if (isErrorResult(result)) throw new Error('Profile picture deletion failed')
}

/**
 * The upload answers with an empty body, so the new stored path is read back from the
 * user. Only the signed-in user's own picture is mirrored into the session (top bar).
 */
export async function syncOwnProfilePicture(userId: number): Promise<void> {
    const session = selectAuthSession(store.getState())
    if (!session || session.user.userId !== userId) return

    const fetched = (await apiExecutor({url: `/user/${userId}`, method: 'GET'})) as User
    if (isErrorResult(fetched)) return
    store.dispatch(authActions.setSession({
        ...session,
        user: {
            ...session.user,
            userDetail: {...session.user.userDetail, profilePicture: fetched.userDetail.profilePicture ?? null},
        },
    }))
}

type UploadCtx = {
    mode?: Mode
    formData?: UserUpdateDto
    payload?: UserUpdateDto & {userId?: number}
    response?: Partial<User>
}

/** Fires when the user staged a freshly picked picture in the wizard. */
export const hasProfilePictureFile = (ctx: UploadCtx) => isImageFile(ctx.formData?.profilePicture)

/** Fires only on update when the user cleared a picture that the user actually had. */
export const shouldDeleteProfilePicture = (ctx: UploadCtx) =>
    ctx.mode === 'update' &&
    ctx.formData?.profilePicture == null &&
    typeof ctx.formData?.profilePictureOriginal === 'string' &&
    ctx.formData.profilePictureOriginal.trim().length > 0

const resolveUserId = (ctx: UploadCtx): number | undefined =>
    ctx.response?.userId ?? ctx.payload?.userId

/** Wizard after-save action; runs after the user PUT/POST so a changed email is already stored. */
export async function uploadUserProfilePicture(ctx: UploadCtx): Promise<void> {
    const file = ctx.formData?.profilePicture
    const email = ctx.payload?.email ?? ctx.response?.email
    if (!isImageFile(file) || !email) return

    await uploadProfilePicture(file, email)
    const userId = resolveUserId(ctx)
    if (typeof userId === 'number') await syncOwnProfilePicture(userId)
}

/** Wizard after-save action for a picture removed in the wizard image. */
export async function deleteUserProfilePicture(ctx: UploadCtx): Promise<void> {
    const userId = resolveUserId(ctx)
    if (typeof userId !== 'number') return

    await deleteProfilePicture(userId)
    await syncOwnProfilePicture(userId)
}
