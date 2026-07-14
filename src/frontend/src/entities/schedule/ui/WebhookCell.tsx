import { memo, useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { copyToClipboard } from '@shared/utils/copyToClipboard'
import { useGeneralRequestMutation } from '@shared/api/genericApi'
import { createScheduleWebhook } from '../model/createScheduleWebhook'
import { resolveWebhookUrl } from '../model/resolveWebhookUrl'
import type { Schedule } from '../model/types'

type Props = {
    schedule: Schedule
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

export const WebhookCell = memo(function WebhookCell({ schedule, tooltipPlacement }: Props) {
    const { t: tEntities } = useI18n('entities')
    const confirm = useConfirm()
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)

    const webhook = schedule.webhook

    const handleCopy = async () => {
        if (!webhook?.url) return
        if (await copyToClipboard(resolveWebhookUrl(webhook.url))) {
            message.success(tEntities('schedule.webhook.copied'))
        }
        // clipboard rejection is non-critical
    }

    const handleDelete = async () => {
        if (!webhook) return
        const ok = await confirm({
            title: tEntities('schedule.webhook.confirmDelete.title'),
            message: tEntities('schedule.webhook.confirmDelete.message'),
            onConfirm: async () => {
                setPending(true)
                try {
                    await generalRequest({
                        url: `/webhook/${webhook.webhookId}`,
                        method: 'DELETE',
                        options: {},
                    }).unwrap()
                } finally {
                    setPending(false)
                }
            },
        })
        if (!ok) return

        message.success(tEntities('schedule.webhook.deleted'))
    }

    const handleCreate = async () => {
        setPending(true)
        try {
            const created = await createScheduleWebhook(schedule.schedulerId)
            if (created) message.success(tEntities('schedule.webhook.created'))
        } finally {
            setPending(false)
        }
    }

    if (!webhook) {
        return (
            <Tooltip content={tEntities('schedule.webhook.createTooltip')} placement={tooltipPlacement}>
                <IconButton
                    iconProps={{ name: 'webhook', color: 'primary' }}
                    size="xs"
                    type="text"
                    onClick={handleCreate}
                    loading={pending}
                />
            </Tooltip>
        )
    }

    return (
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <Tooltip content={tEntities('schedule.webhook.copyTooltip')} placement={tooltipPlacement}>
                <IconButton
                    iconProps={{ name: 'content-copy', color: 'primary' }}
                    size="xs"
                    type="text"
                    onClick={handleCopy}
                />
            </Tooltip>
            <Tooltip content={tEntities('schedule.webhook.deleteTooltip')} placement={tooltipPlacement}>
                <IconButton
                    iconProps={{ name: 'delete', color: 'danger' }}
                    size="xs"
                    type="text"
                    loading={pending}
                    onClick={handleDelete}
                />
            </Tooltip>
        </span>
    )
})
