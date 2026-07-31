import {apiExecutor} from '@shared/api/apiExecutor'
import {isImageFile} from '@shared/utils/fileTypeGuards'
import type {Connector, ConnectorUpdateDto} from '@entities/connector/model/types'

type IconCtx = {
    mode?: 'create' | 'update' | 'view'
    formData?: ConnectorUpdateDto
    response?: Connector
    payload?: Connector
}

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0

const resolveConnectorId = (ctx: IconCtx): number | undefined =>
    ctx.response?.connectorId ?? ctx.payload?.connectorId

/** Fires when the user staged a freshly picked image to upload or replace the icon. */
export const hasConnectorIconFile = (ctx: IconCtx) => isImageFile(ctx.formData?.icon)

/**
 * Fires only on update when the user cleared an icon that the connector actually had.
 * `iconOriginal` is the path loaded from the server; `icon` is null once the user
 * removes it. A fresh File (replace) takes the upload path instead, not this one.
 */
export const shouldDeleteConnectorIcon = (ctx: IconCtx) =>
    ctx.mode === 'update' &&
    ctx.formData?.icon == null &&
    isNonEmptyString(ctx.formData?.iconOriginal)

/**
 * Upload or replace the connector icon via the dedicated endpoint. On replace the
 * backend deletes the previous file before storing the new one, so the connector
 * PUT must have echoed the old icon path back first (see mapToApi).
 */
export const uploadConnectorIcon = async (ctx: IconCtx) => {
    const icon = ctx.formData?.icon
    const connectorId = resolveConnectorId(ctx)

    if (!isImageFile(icon) || !connectorId) return

    const body = new FormData()
    body.append('file', icon)

    await apiExecutor({
        url: `/connector/${connectorId}/icon`,
        method: 'POST',
        body,
    })
}

/** Remove the stored icon file and clear the connector's icon column. */
export const deleteConnectorIcon = async (ctx: IconCtx) => {
    const connectorId = resolveConnectorId(ctx)
    if (!connectorId) return

    await apiExecutor({
        url: `/connector/${connectorId}/icon`,
        method: 'DELETE',
    })
}
