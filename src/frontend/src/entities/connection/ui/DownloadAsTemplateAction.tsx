import React, { useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import type { Connection } from '@entities/connection/model/types'

type Props = {
    row: Connection
}

type Template = {
    templateId: string | number
    [key: string]: unknown
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

export const DownloadAsTemplateAction: React.FC<Props> = ({ row }) => {
    const [isLoading, setIsLoading] = useState(false)
    const { t: tEntities } = useI18n('entities')

    const handleClick = async () => {
        if (row.id == null) return
        setIsLoading(true)
        try {
            const template = (await apiExecutor({
                url: `/template/connection/${row.id}`,
                method: 'GET',
            })) as Template

            const filename = String(template?.templateId ?? row.id)
            triggerJsonDownload(filename, template)

            message.success(tEntities('connection.list.downloadTemplate.success', { name: filename }))
        } catch (err) {
            console.error(err)
            message.error(tEntities('connection.list.downloadTemplate.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Tooltip content={tEntities('connection.list.downloadTemplate.tooltip')} placement="right">
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
