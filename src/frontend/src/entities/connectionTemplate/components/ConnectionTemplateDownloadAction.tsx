import React, { useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'

type Props = {
    row: unknown
    rowId: string
}

function triggerJsonDownload(filename: string, payload: unknown) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

export const ConnectionTemplateDownloadAction: React.FC<Props> = ({ row, rowId }) => {
    const [isLoading, setIsLoading] = useState(false)
    const { t: tEntities } = useI18n('entities')

    const template = (row ?? {}) as Partial<ConnectionTemplate> & { templateId?: string | number }
    const id = String(template.templateId ?? template.id ?? rowId ?? '')

    const handleClick = async () => {
        if (!id) return
        setIsLoading(true)
        try {
            const fetched = (await apiExecutor({
                url: `/template/${encodeURIComponent(id)}`,
                method: 'GET',
            })) as ConnectionTemplate

            const filename = String(fetched?.name ?? template.name ?? id)
            triggerJsonDownload(filename, fetched)

            message.success(tEntities('connection-template.list.download.success', { name: filename }))
        } catch (err) {
            console.error(err)
            message.error(tEntities('connection-template.list.download.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Tooltip content={tEntities('connection-template.list.download.tooltip')}>
            <IconButton
                iconProps={{ name: 'download', color: 'primary' }}
                type={'text'}
                size={'xs'}
                loading={isLoading}
                onClick={handleClick}
            />
        </Tooltip>
    )
}
