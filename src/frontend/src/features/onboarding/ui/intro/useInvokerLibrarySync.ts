import { message } from 'antd'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import {
    useDownloadInvokersFromRepositoryMutation,
    useSyncInvokersFromServicePortalMutation,
} from '@entities/invoker/api/invokerApi'
import {
    useOnlineFeature,
    useServicePortalFeature,
    type OnlineFeatureAvailability,
} from '@entities/subscription/model/useOnlineFeature'

export type InvokerLibrarySource = 'servicePortal' | 'repository'

/**
 * Picks where the "install the library" option pulls from. A Service Portal that is
 * configured, enabled for invoker sync and answering the live connection check wins;
 * anything short of that falls back to the public git repository. Until the portal
 * check settles the source cannot be known, so the repository layout is shown with
 * its action still in `checking`.
 */
export function useInvokerLibrarySync() {
    const { t } = useI18n('onboarding')
    const portal = useServicePortalFeature('invoker')
    const repository = useOnlineFeature()
    const [downloadFromRepository, { isLoading: isDownloading }] = useDownloadInvokersFromRepositoryMutation()
    const [syncFromPortal, { isLoading: isSyncing }] = useSyncInvokersFromServicePortalMutation()

    const source: InvokerLibrarySource = portal.state === 'available' ? 'servicePortal' : 'repository'
    const availability: OnlineFeatureAvailability =
        portal.state === 'checking' || source === 'servicePortal' ? portal : repository

    /**
     * Outcomes go to toasts, not inline alerts: a run that installs anything refetches
     * the invoker list, and the tour then swaps this step for its "you already have
     * invokers" variant — an alert rendered here would vanish with it. Repository
     * `reason` strings are backend-authored sentences, so they are shown as they arrive.
     */
    const runRepositoryDownload = async () => {
        try {
            const { installed, failed } = await downloadFromRepository().unwrap()
            if (installed.length > 0) {
                message.success(t('content.invoker.gitSuccess', { count: installed.length }))
            } else if (failed.length === 0) {
                message.info(t('content.invoker.gitEmpty'))
            }
            if (failed.length > 0) {
                notifyError(
                    failed.map(failure => `${failure.fileName}: ${failure.reason}`).join('\n'),
                    undefined,
                    t('content.invoker.gitFailed', { count: failed.length }),
                )
            }
        } catch (error) {
            console.error(error)
            notifyError(t('content.invoker.gitError'))
        }
    }

    const runPortalSync = async () => {
        try {
            const response = await syncFromPortal().unwrap()
            if (response?.result) notifyError(t('content.invoker.portalDisabled'))
            else message.success(t('content.invoker.portalSuccess'))
        } catch (error) {
            console.error(error)
            notifyError(t('content.invoker.portalError'))
        }
    }

    return {
        source,
        availability,
        isRunning: isDownloading || isSyncing,
        run: source === 'servicePortal' ? runPortalSync : runRepositoryDownload,
    }
}
