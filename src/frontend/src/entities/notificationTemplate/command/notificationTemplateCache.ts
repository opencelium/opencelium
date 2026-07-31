import { store } from '@app/store/store'
import { notificationTemplateApi } from '@entities/notificationTemplate/api/notificationTemplateApi'
import type { NotificationTemplate } from '@entities/notificationTemplate/model/types'

export function getNotificationTemplatesFromCache(): NotificationTemplate[] {
    return notificationTemplateApi.endpoints.getNotificationTemplates.select(undefined)(store.getState()).data ?? []
}

export function findNotificationTemplateIdByName(name: string): number | undefined {
    return getNotificationTemplatesFromCache().find((t) => t.name === name)?.templateId
}
