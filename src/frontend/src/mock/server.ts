import { setupWorker } from 'msw/browser'
import { userHandlers } from './user/handler.ts'
import { authHandlers } from '@/mock/auth/auth.ts'
import { categoryHandlers } from '@/mock/category/handler.ts'
import { aggregatorHandlers } from '@/mock/aggregator/handler.ts'
import { notificationTemplateHandlers } from '@/mock/notificationTemplate/handler.ts'
import { invokerHandlers } from '@/mock/invoker/handler.ts'
import { connectionTemplateHandlers } from '@/mock/connectionTemplate/handler.ts'
import { updateAssistantHandlers } from '@/mock/updateAssistant/handler.ts'
import { supportFileHandlers } from '@/mock/supportFile/handler.ts'
import { connectionHandlers } from '@/mock/connection/handler.ts'
import { subscriptionHandlers } from '@/mock/subscription/handler.ts'

export const worker = setupWorker(
    ...authHandlers,
    ...userHandlers,
    ...categoryHandlers,
    ...aggregatorHandlers,
    ...notificationTemplateHandlers,
    ...invokerHandlers,
    ...connectionTemplateHandlers,
    ...updateAssistantHandlers,
    ...supportFileHandlers,
    ...connectionHandlers,
    ...subscriptionHandlers,
)
