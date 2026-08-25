import React, { useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { downloadInvoker } from '@entities/invoker/lib/downloadInvoker'
import { notifyError } from '@shared/ui/feedback/notifyError'
import type { CustomActionContext } from '@/engine/entity/EntityDefinition'

/**
 * Row action: saves the invoker's XML the same way the command palette's
 * `download invoker by name` does — both go through `downloadInvoker`, which
 * re-serializes the fetched record rather than fetching a file, so the two can
 * never disagree about what an exported invoker looks like.
 */
export const InvokerDownloadAction: React.FC<CustomActionContext> = ({
    rowId, iconSize, tooltipPlacement, testId,
}) => {
    const { t: tCommon } = useI18n('common')
    const { t: tEntities } = useI18n('entities')
    const [isDownloading, setIsDownloading] = useState(false)

    const handleClick = async () => {
        setIsDownloading(true)
        try {
            const downloaded = await downloadInvoker(rowId)
            message.success(tEntities('invoker.list.download.success', { name: downloaded }))
        } catch (err) {
            console.error(err)
            notifyError(tEntities('invoker.list.download.error'))
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <Tooltip content={tCommon('actions.download')} placement={tooltipPlacement}>
            <IconButton
                iconProps={{ name: 'download', color: 'primary', size: iconSize }}
                type="text"
                size="xs"
                loading={isDownloading}
                onClick={handleClick}
                testId={testId}
            />
        </Tooltip>
    )
}
