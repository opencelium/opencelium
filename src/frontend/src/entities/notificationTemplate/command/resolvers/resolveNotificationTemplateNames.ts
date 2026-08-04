import { store } from '@app/store/store'
import { notificationTemplateApi } from '@entities/notificationTemplate/api/notificationTemplateApi'
import { debouncePromise } from '@shared/utils/debouncePromise'

async function _resolveNotificationTemplateNames(input: string): Promise<string[]> {
    const result = await store.dispatch(
        notificationTemplateApi.endpoints.getNotificationTemplates.initiate(undefined, { subscribe: false })
    )
    if ('data' in result && result.data) {
        return result.data
            .filter((t) => t.name.toLowerCase().includes(input.toLowerCase()))
            .map((t) => t.name)
    }
    return []
}

export const resolveNotificationTemplateNames = debouncePromise(_resolveNotificationTemplateNames, 300)
