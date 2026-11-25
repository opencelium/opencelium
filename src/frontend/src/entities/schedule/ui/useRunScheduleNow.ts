import {useCallback, useState} from 'react'
import {message} from 'antd'
import {useGeneralRequestMutation} from '@shared/api/genericApi'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {notifyError} from '@shared/ui/feedback/notifyError'

// The backend rejects a manual trigger while the schedule is already running
// with this code; it can surface in the error body's message/error/code field.
function isConcurrentTestForbidden(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const data = (error as {data?: unknown}).data
    const candidates = [error, data].flatMap((source) =>
        source && typeof source === 'object'
            ? [
                  (source as Record<string, unknown>).message,
                  (source as Record<string, unknown>).error,
                  (source as Record<string, unknown>).code,
              ]
            : [source]
    )
    return candidates.some(
        (value) =>
            typeof value === 'string' && value.includes('CONCURRENT_TEST_IS_FORBIDDEN')
    )
}

// A workflow with a mutable global variable runs once at a time; a start its busy policy
// refuses answers 409 with code BUSY, whose message names the variable and the running execution.
function readBusyMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null
    const data = (error as {data?: unknown}).data
    if (!data || typeof data !== 'object') return null
    const {code, message: detail} = data as Record<string, unknown>
    return code === 'BUSY' ? (typeof detail === 'string' ? detail : '') : null
}

export function useRunScheduleNow(schedulerId: number) {
    const {t: tEntities} = useI18n('entities')
    const [generalRequest] = useGeneralRequestMutation()
    const [pending, setPending] = useState(false)

    const run = useCallback(async () => {
        setPending(true)
        try {
            await generalRequest({
                url: `/scheduler/execute/${schedulerId}`,
                method: 'GET',
                options: {ignoreError: true},
            }).unwrap()
            message.success(tEntities('schedule.start.success'))
        } catch (error) {
            const busy = readBusyMessage(error)
            if (busy !== null) {
                notifyError(tEntities('schedule.start.error.busy', {detail: busy}))
                return
            }
            const key = isConcurrentTestForbidden(error)
                ? 'schedule.start.error.concurrentForbidden'
                : 'schedule.start.error.failed'
            notifyError(tEntities(key))
        } finally {
            setPending(false)
        }
    }, [generalRequest, schedulerId, tEntities])

    return {run, pending}
}
