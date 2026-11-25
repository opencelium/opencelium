import {useCallback, useState} from 'react'
import {message} from 'antd'
import {useGeneralRequestMutation} from '@shared/api/genericApi'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {notifyError} from '@shared/ui/feedback/notifyError'
import type {Schedule} from '../model/types'

export function useToggleScheduleStatus(schedule: Schedule) {
    const {t: tEntities} = useI18n('entities')
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)
    const isActive = Boolean(schedule.status)

    const toggle = useCallback(async () => {
        setPending(true)
        try {
            await generalRequest({
                url: `/scheduler/${schedule.schedulerId}/status`,
                method: 'PUT',
                body: {status: !isActive},
                options: {ignoreError: true},
            }).unwrap()
            message.success(tEntities(isActive ? 'schedule.run.pauseSuccess' : 'schedule.run.resumeSuccess'))
        } catch {
            notifyError(tEntities('schedule.run.statusFailed'))
        } finally {
            setPending(false)
        }
    }, [generalRequest, isActive, schedule.schedulerId, tEntities])

    return {toggle, pending, isActive}
}
