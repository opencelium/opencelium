import { apiExecutor } from '@shared/api/apiExecutor'
import { genericApi } from '@shared/api/genericApi'
import { selectAuthUser } from '@entities/auth/model/authSelectors'
import { store } from '@app/store/store'
import type { Schedule, ScheduleWebhook } from './types'

export async function createScheduleWebhook(schedulerId: number): Promise<ScheduleWebhook | undefined> {
    const userId = selectAuthUser(store.getState())?.userId
    if (userId == null) return undefined

    const response = (await apiExecutor({
        url: `/webhook/url/${userId}/${schedulerId}`,
        method: 'GET',
    })) as ScheduleWebhook | undefined

    if (!response?.url || response?.webhookId == null) return undefined

    const created: ScheduleWebhook = {
        url: response.url,
        webhookId: response.webhookId,
    }
    store.dispatch(
        genericApi.util.updateQueryData('fetchEntities', '/scheduler/all', (draft) => {
            if (!Array.isArray(draft)) return
            const row = draft.find((r: Schedule) => r.schedulerId === schedulerId)
            if (row) row.webhook = created
        }),
    )
    return created
}
