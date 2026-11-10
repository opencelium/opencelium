import { message } from 'antd'
import { notifyError } from '@shared/ui/feedback/notifyError'

let quietDepth = 0

/**
 * Runs a spoken request without toasts. What could not be done is not shown: Beebot hears everything said while it is
 * on, and talk that happens to sound like a command must not raise errors. What was done shows by itself (the step
 * appears, the dialog opens), so it is not confirmed either.
 */
export async function quietly<T>(run: () => Promise<T>): Promise<T> {
    quietDepth += 1
    try {
        return await run()
    } finally {
        quietDepth -= 1
    }
}

export const isQuiet = (): boolean => quietDepth > 0

/** How a request handled in the editor reports back: a toast; inside `quietly` (spoken), nothing at all. */
export const tell = {
    success: (text: string) => {
        if (!isQuiet()) message.success(text)
    },
    info: (text: string) => {
        if (!isQuiet()) message.info(text)
    },
    error: (text: string) => {
        if (!isQuiet()) notifyError(text)
    },
}
