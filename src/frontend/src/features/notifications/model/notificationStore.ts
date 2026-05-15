import { create } from 'zustand'
import { Notification, NotificationType } from './types'

type NotificationState = {
    notifications: Notification[]
    push: (
        type: NotificationType,
        messageKey: string,
        params?: Record<string, unknown>
    ) => void
    remove: (id: string) => void
    clear: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],

    push: (type, messageKey, params) =>
        set((state) => ({
            notifications: [
                ...state.notifications,
                {
                    id: crypto.randomUUID(),
                    type,
                    messageKey,
                    params,
                    createdAt: Date.now(),
                },
            ],
        })),

    remove: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),

    clear: () => set({ notifications: [] }),
}))
