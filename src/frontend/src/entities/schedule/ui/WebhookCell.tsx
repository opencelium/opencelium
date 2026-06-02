import { useState } from 'react'
import { message } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import { genericApi, useGeneralRequestMutation } from '@shared/api/genericApi'
import { selectAuthUser } from '@entities/auth/model/authSelectors'
import { store } from '@app/store/store'
import type { Schedule, ScheduleWebhook } from '../model/types'

type Props = {
    schedule: Schedule
}

export function WebhookCell({ schedule }: Props) {
    const { t: tEntities } = useI18n('entities')
    const confirm = useConfirm()
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)

    const webhook = schedule.webhook

    const handleCopy = async () => {
        if (!webhook?.url) return
        const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
        try {
            await navigator.clipboard.writeText(`${baseUrl}${webhook.url}`)
            message.success(tEntities('schedule.webhook.copied'))
        } catch {
            // clipboard rejection is non-critical
        }
    }

    const handleDelete = async () => {
        if (!webhook) return
        const ok = await confirm({
            title: tEntities('schedule.webhook.confirmDelete.title'),
            message: tEntities('schedule.webhook.confirmDelete.message'),
        })
        if (!ok) return

        setPending(true)
        try {
            await generalRequest({
                url: `/webhook/${webhook.webhookId}`,
                method: 'DELETE',
                options: {},
            }).unwrap()
            message.success(tEntities('schedule.webhook.deleted'))
        } catch {
            // error surfaced by errorBus
        } finally {
            setPending(false)
        }
    }

    const handleCreate = async () => {
        const userId = selectAuthUser(store.getState())?.userId
        if (userId == null) return

        setPending(true)
        try {
            const response = (await apiExecutor({
                url: `/webhook/url/${userId}/${schedule.schedulerId}`,
                method: 'GET',
            })) as ScheduleWebhook | undefined

            if (response?.url && response?.webhookId != null) {
                const created: ScheduleWebhook = {
                    url: response.url,
                    webhookId: response.webhookId,
                }
                store.dispatch(
                    genericApi.util.updateQueryData('fetchEntities', '/scheduler/all', (draft) => {
                        if (!Array.isArray(draft)) return
                        const row = draft.find(
                            (r: Schedule) => r.schedulerId === schedule.schedulerId,
                        )
                        if (row) row.webhook = created
                    }),
                )
                message.success(tEntities('schedule.webhook.created'))
            }
        } finally {
            setPending(false)
        }
    }

    if (!webhook) {
        return (
            <Tooltip content={tEntities('schedule.webhook.createTooltip')}>
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
            <Tooltip content={tEntities('schedule.webhook.copyTooltip')}>
                <IconButton
                    iconProps={{ name: 'content-copy', color: 'primary' }}
                    size="xs"
                    type="text"
                    onClick={handleCopy}
                />
            </Tooltip>
            <Tooltip content={tEntities('schedule.webhook.deleteTooltip')}>
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
}
