import { useState } from 'react'
import { message } from 'antd'
import { Switch } from '@shared/ui/primitives/Switch'
import { useGeneralRequestMutation } from '@shared/api/genericApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Schedule } from '../model/types'

type Props = {
    schedule: Schedule
}

export function DebugModeCell({ schedule }: Props) {
    const [generalRequest] = useGeneralRequestMutation()
    const { t: tEntities } = useI18n('entities')
    const [pending, setPending] = useState(false)
    const [optimistic, setOptimistic] = useState<boolean | null>(null)

    const checked = optimistic ?? schedule.debugMode

    const handleChange = async (next: boolean) => {
        setOptimistic(next)
        setPending(true)
        try {
            await generalRequest({
                url: `/scheduler/${schedule.schedulerId}`,
                method: 'PUT',
                body: {
                    ...schedule,
                    debugMode: next,
                    connectionId: schedule.connection?.connectionId,
                },
                options: {},
            }).unwrap()
            message.success(
                tEntities(next ? 'schedule.debugMode.enableSuccess' : 'schedule.debugMode.disableSuccess'),
            )
        } catch {
            setOptimistic(null)
        } finally {
            setPending(false)
        }
    }

    return <Switch checked={checked} loading={pending} onChange={handleChange} />
}
