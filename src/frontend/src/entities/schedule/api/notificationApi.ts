import { baseApi } from '@shared/api/baseApi'
import type { ScheduleNotification } from '../model/notification.types'

const NOTIFICATION_TAG = 'ScheduleNotification' as const

type CreateArgs = { schedulerId: number; body: unknown }
type UpdateArgs = { schedulerId: number; notificationId: number; body: unknown }
type DeleteArgs = { schedulerId: number; notificationId: number }

export const notificationApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getNotifications: b.query<ScheduleNotification[], number>({
            query: (schedulerId) => `/scheduler/${schedulerId}/notification/all`,
            providesTags: (_result, _error, schedulerId) => [
                { type: NOTIFICATION_TAG as never, id: schedulerId },
            ],
        }),
        createNotification: b.mutation<ScheduleNotification, CreateArgs>({
            query: ({ schedulerId, body }) => ({
                url: `/scheduler/${schedulerId}/notification`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_r, _e, { schedulerId }) => [
                { type: NOTIFICATION_TAG as never, id: schedulerId },
            ],
        }),
        updateNotification: b.mutation<unknown, UpdateArgs>({
            query: ({ notificationId, body }) => ({
                url: `/scheduler/notification/${notificationId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_r, _e, { schedulerId }) => [
                { type: NOTIFICATION_TAG as never, id: schedulerId },
            ],
        }),
        deleteNotification: b.mutation<unknown, DeleteArgs>({
            query: ({ notificationId }) => ({
                url: `/scheduler/notification/${notificationId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_r, _e, { schedulerId }) => [
                { type: NOTIFICATION_TAG as never, id: schedulerId },
            ],
        }),
    }),
})

export const {
    useGetNotificationsQuery,
    useCreateNotificationMutation,
    useUpdateNotificationMutation,
    useDeleteNotificationMutation,
} = notificationApi
