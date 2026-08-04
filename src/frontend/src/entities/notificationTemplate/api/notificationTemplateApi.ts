import { baseApi } from '@shared/api/baseApi'
import type { NotificationTemplate } from '../model/types'
import { NOTIFICATION_TEMPLATE_TAG } from './notificationTemplate.tags'

export const notificationTemplateApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getNotificationTemplates: b.query<NotificationTemplate[], void>({
            query: () => '/message/all',
            providesTags: (result) =>
                result
                    ? [
                        { type: NOTIFICATION_TEMPLATE_TAG, id: 'LIST' },
                        { type: 'Entity' as any, id: '/message/all' },
                        ...result.map((t) => ({ type: NOTIFICATION_TEMPLATE_TAG, id: t.templateId })),
                      ]
                    : [{ type: NOTIFICATION_TEMPLATE_TAG, id: 'LIST' }],
        }),
    }),
})

export const { useGetNotificationTemplatesQuery } = notificationTemplateApi
