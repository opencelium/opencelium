import { store } from '@app/store/store'
import { notificationTemplateApi } from '@entities/notificationTemplate/api/notificationTemplateApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveNotificationTemplateIds(input: string): Promise<string[]> {
    const result = await store.dispatch(
        notificationTemplateApi.endpoints.getNotificationTemplates.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((t) => String(t.templateId).includes(input))
            .map((t) => String(t.templateId))
    }
    return []
}

export const resolveNotificationTemplateIds = debouncePromise(_resolveNotificationTemplateIds, 300)
