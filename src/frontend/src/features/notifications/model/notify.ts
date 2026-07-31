import { useNotificationStore } from './notificationStore'

export const notify = {
    success: (key: string, params?: Record<string, unknown>) =>
        useNotificationStore.getState().push('success', key, params),

    error: (key: string, params?: Record<string, unknown>) =>
        useNotificationStore.getState().push('error', key, params),

    info: (key: string, params?: Record<string, unknown>) =>
        useNotificationStore.getState().push('info', key, params),

    warning: (key: string, params?: Record<string, unknown>) =>
        useNotificationStore.getState().push('warning', key, params),
}
