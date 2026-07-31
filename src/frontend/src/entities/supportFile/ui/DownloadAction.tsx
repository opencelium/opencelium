import React, { useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import { extractFilename } from '../model/supportFile.utils'
import type { SupportFile } from '../model/types'

type Props = {
    row: SupportFile
}

function triggerBlobDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

export const DownloadAction: React.FC<Props> = ({ row }) => {
    const [isLoading, setIsLoading] = useState(false)
    const { t: tEntities } = useI18n('entities')

    const handleClick = async () => {
        if (!row.supportFile) return
        setIsLoading(true)
        try {
            const blob = (await apiExecutor({
                url: row.supportFile,
                method: 'GET',
                options: { responseType: 'blob' },
            })) as Blob
            triggerBlobDownload(extractFilename(row.supportFile), blob)
            message.success(tEntities('support-file.list.download.success'))
        } catch (err) {
            console.error(err)
            message.error(tEntities('support-file.list.download.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Tooltip content={tEntities('support-file.list.download.tooltip')} placement="top">
            <IconButton
                iconProps={{ name: 'download', color: 'primary', size: 15 }}
                type={'text'}
                size={'xs'}
                loading={isLoading}
                onClick={handleClick}
            />
        </Tooltip>
    )
}
