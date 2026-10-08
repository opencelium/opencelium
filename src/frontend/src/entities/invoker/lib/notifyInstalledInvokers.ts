import { message } from 'antd'
import { i18n } from '@shared/i18n/config/i18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import type { InvokerRepositoryDownload } from '@entities/invoker/model/types'

/** The failure `reason`s are backend-authored sentences, so they are shown as they arrive. */
export function notifyInstalledInvokers({ installed, failed }: InvokerRepositoryDownload) {
    const t = i18n.getFixedT(i18n.language, 'entities')
    if (installed.length > 0) {
        message.success(t('invoker.list.repository.success', { count: installed.length }))
    } else if (failed.length === 0) {
        message.info(t('invoker.list.repository.empty'))
    }
    if (failed.length > 0) {
        notifyError(
            failed.map((failure) => `${failure.fileName}: ${failure.reason}`).join('\n'),
            undefined,
            t('invoker.list.repository.failed', { count: failed.length }),
        )
    }
}
