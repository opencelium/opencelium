import {apiExecutor} from '@shared/api/apiExecutor'
import {isImageFile} from '@shared/utils/fileTypeGuards'
import type {Connector, ConnectorUpdateDto} from '@entities/connector/model/types'

type UploadCtx = {
    formData?: ConnectorUpdateDto
    response?: Connector
    payload?: Connector
}

export const hasConnectorIconFile = (ctx: UploadCtx) => isImageFile(ctx.formData?.icon)

export const uploadConnectorIcon = async (ctx: UploadCtx) => {
    const icon = ctx.formData?.icon
    const connectorId = ctx.response?.connectorId ?? ctx.payload?.connectorId

    if (!isImageFile(icon) || !connectorId) return

    const body = new FormData()
    body.append('file', icon)
    body.append('connectorId', String(connectorId))

    await apiExecutor({
        url: '/storage/connector',
        method: 'POST',
        body,
    })
}
