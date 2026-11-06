import { message } from 'antd'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useBeebotReplyStore } from '../voice/beebotReply.store'

/** How a request handled in the editor reports back: the toast, and the same words aloud when Beebot was asked. */
export const tell = {
    success: (text: string) => {
        message.success(text)
        useBeebotReplyStore.getState().reply(text)
    },
    info: (text: string) => {
        message.info(text)
        useBeebotReplyStore.getState().reply(text)
    },
    error: (text: string) => {
        notifyError(text)
        useBeebotReplyStore.getState().reply(text)
    },
}
