import { useState } from 'react'
import { message } from 'antd'
import { Switch } from '@shared/ui/primitives/Switch'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGeneralRequestMutation } from '@shared/api/genericApi'

type Props = {
    userId: number
    enabled: boolean
}

export function TotpToggle({ userId, enabled }: Props) {
    const confirm = useConfirm()
    const { t: tEntities } = useI18n('entities')
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)
    const handleChange = async (next: boolean) => {
        if (!next) {
            const ok = await confirm({
                title: tEntities('user.totp.confirmDisable.title'),
                message: tEntities('user.totp.confirmDisable.message'),
            })
            if (!ok) {
                return
            }
        }
        setPending(true)

        const startedAt = Date.now()
        const verb = next ? 'enable' : 'disable'

        try {
            await generalRequest({
                url: `/user/${userId}/totp/${verb}`,
                method: 'PUT',
                options: {},
            }).unwrap()
            message.success(tEntities(`user.totp.${verb}Success`))
        } catch {
            // errorBus surfaces the failure via the API layer
        } finally {
            const elapsed = Date.now() - startedAt
            const MIN_VISIBLE_MS = 400
            if (elapsed < MIN_VISIBLE_MS) {
                await new Promise((r) => setTimeout(r, MIN_VISIBLE_MS - elapsed))
            }
            setPending(false)
        }
    }

    return (
        <Switch
            checked={enabled}
            loading={pending}
            onChange={handleChange}
        />
    )
}
