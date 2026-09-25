import React, { useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { downloadConnectionTemplate } from '@entities/connectionTemplate/lib/downloadConnectionTemplate'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'
import { notifyError } from '@shared/ui/feedback/notifyError'

type Props = {
    row: unknown
    rowId: string
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
            const filename = await downloadConnectionTemplate(id)
            message.success(tEntities('connection-template.list.download.success', { name: filename }))
        } catch (err) {
            console.error(err)
            notifyError(tEntities('connection-template.list.download.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Tooltip content={tEntities('connection-template.list.download.tooltip')} placement="top">
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
