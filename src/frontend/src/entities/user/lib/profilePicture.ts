import {apiExecutor} from '@shared/api/apiExecutor'
import {isImageFile} from '@shared/utils/fileTypeGuards'
import type {Mode} from '@/engine/entity/EntityDefinition'
import type {User, UserUpdateDto} from '@entities/user/model/types'
import {isErrorResult} from '@entities/user/lib/ownSessionUser'

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
}

/** Wizard after-save action for a picture removed in the wizard image. */
export async function deleteUserProfilePicture(ctx: UploadCtx): Promise<void> {
    const userId = resolveUserId(ctx)
    if (typeof userId !== 'number') return

    await deleteProfilePicture(userId)
}
