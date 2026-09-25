import { useState } from 'react'
import { message } from 'antd'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'
import { useAppDispatch } from '@shared/lib/storeHooks'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { SUBSCRIPTION_TAG } from '@entities/subscription/api/subscription.tags'
import { notifyError } from '@shared/ui/feedback/notifyError'

export type LicenseActionKind =
    | 'generateRequest'
    | 'importLicense'
    | 'activate'
    | 'extraOps'
    | 'deleteLicense'
    | 'activateFree'

const ACTIVATION_REQUEST_FILENAME = 'opencelium_activate_request.txt'

// apiExecutor returns the RTK error object instead of throwing.
function ensureOk(result: unknown): unknown {
    if (
        !!result &&
        typeof result === 'object' &&
        ('status' in result || 'error' in result)
    ) {
        throw new Error('License action request failed')
    }
    return result
}

function triggerBlobDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

export function useLicenseActions() {
    const dispatch = useAppDispatch()
    const confirm = useConfirm()
    const { t } = useI18n('entities')
    const [pendingAction, setPendingAction] = useState<LicenseActionKind | null>(null)

    const run = async (
        kind: LicenseActionKind,
        action: () => Promise<void>,
        successKey: string,
    ): Promise<boolean> => {
        setPendingAction(kind)
        try {
            await action()
            message.success(t(successKey as never))
            dispatch(baseApi.util.invalidateTags([SUBSCRIPTION_TAG]))
            return true
        } catch (err) {
            // API failures are surfaced by errorBus; this covers download/transport errors.
            console.error(err)
            notifyError(t('subscription.manage.error' as never))
            return false
        } finally {
            setPendingAction(null)
        }
    }

    const generateActivationRequest = () =>
        run(
            'generateRequest',
            async () => {
                // Response is text/plain, not JSON — fetch it as a Blob and download as-is.
                const blob = (await apiExecutor({
                    url: '/subs/activation/request/generate',
                    method: 'GET',
                    options: { responseType: 'blob' },
                })) as Blob
                triggerBlobDownload(ACTIVATION_REQUEST_FILENAME, blob)
            },
            'subscription.manage.generateRequest.success',
        )

    const importLicense = (file: File) =>
        run(
            'importLicense',
            async () => {
                const body = new FormData()
                body.append('file', file)
                ensureOk(
                    await apiExecutor({ url: '/subs/activate/license', method: 'POST', body }),
                )
            },
            'subscription.manage.importLicense.success',
        )

    const activateSubscription = (subscriptionId: string) =>
        run(
            'activate',
            async () => {
                ensureOk(
                    await apiExecutor({ url: `/subs/${subscriptionId}`, method: 'POST', body: {} }),
                )
            },
            'subscription.manage.activate.success',
        )

    const uploadExtraOps = (file: File) =>
        run(
            'extraOps',
            async () => {
                const body = new FormData()
                body.append('file', file)
                ensureOk(await apiExecutor({ url: '/extra-ops', method: 'POST', body }))
            },
            'subscription.manage.extraOps.success',
        )

    const deleteLicense = async (subId: string): Promise<boolean> => {
        const ok = await confirm({
            title: t('subscription.manage.deleteLicense.confirmTitle' as never),
            message: t('subscription.manage.deleteLicense.confirmMessage' as never),
        })
        if (!ok) return false
        return run(
            'deleteLicense',
            async () => {
                ensureOk(await apiExecutor({ url: `/subs/${subId}`, method: 'DELETE' }))
            },
            'subscription.manage.deleteLicense.success',
        )
    }

    const activateFreeLicense = () =>
        run(
            'activateFree',
            async () => {
                ensureOk(await apiExecutor({ url: '/subs/free/activate', method: 'GET' }))
            },
            'subscription.manage.activateFree.success',
        )

    return {
        pendingAction,
        generateActivationRequest,
        importLicense,
        activateSubscription,
        uploadExtraOps,
        deleteLicense,
        activateFreeLicense,
    }
}
