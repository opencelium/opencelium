import {apiExecutor} from '@shared/api/apiExecutor'
import {isImageFile} from '@shared/utils/fileTypeGuards'
import type {Mode} from '@/engine/entity/EntityDefinition'
import type {Role, RoleUpdateDTO} from '@entities/role/model/types'

type IconCtx = {
    mode?: Mode
    formData?: RoleUpdateDTO
    response?: Role
    payload?: Role
}

const resolveGroupId = (ctx: IconCtx): number | undefined =>
    ctx.response?.groupId ?? ctx.payload?.groupId

/** Fires when the user staged a freshly picked image to upload or replace the icon. */
export const hasRoleIconFile = (ctx: IconCtx) => isImageFile(ctx.formData?.icon)

/** Fires only on update when the user cleared an icon that the group actually had. */
export const shouldDeleteRoleIcon = (ctx: IconCtx) =>
    ctx.mode === 'update' &&
    ctx.formData?.icon == null &&
    typeof ctx.formData?.iconOriginal === 'string' &&
    ctx.formData.iconOriginal.trim().length > 0

/** Upload or replace the group icon; on replace the backend deletes the previous file itself. */
export const uploadRoleIcon = async (ctx: IconCtx) => {
    const icon = ctx.formData?.icon
    const groupId = resolveGroupId(ctx)
    if (!isImageFile(icon) || !groupId) return

    const body = new FormData()
    body.append('file', icon)

    await apiExecutor({
        url: `/storage/groupIcon?userGroupId=${groupId}`,
        method: 'POST',
        body,
    })
}

/** Remove the stored icon file and clear the group's icon column. */
export const deleteRoleIcon = async (ctx: IconCtx) => {
    const groupId = resolveGroupId(ctx)
    if (!groupId) return

    await apiExecutor({
        url: `/role/${groupId}/icon`,
        method: 'DELETE',
    })
}
