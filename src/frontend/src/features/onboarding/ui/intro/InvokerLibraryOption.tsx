import { Button } from '@shared/ui/primitives/Button'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { ONLINE_FEATURE_REASON_KEY } from '@entities/subscription/model/useOnlineFeature'
import { useInvokerLibrarySync } from './useInvokerLibrarySync'

const GIT_INVOKER_REPO = 'github.com/opencelium/invoker · branch main'

export function InvokerLibraryOption() {
    const { t } = useI18n('onboarding')
    const { t: tCommon } = useI18n('common')
    const { source, availability, isRunning, run } = useInvokerLibrarySync()
    const blockReason = availability.state === 'unavailable' ? availability.reason : null
    const isPortal = source === 'servicePortal'

    return (
        <section className="is-recommended">
            <div>
                <h3>
                    {t(isPortal ? 'content.invoker.portalTitle' : 'content.invoker.gitTitle')}{' '}
                    <span className="onboarding-recommended">{t('content.invoker.recommended')}</span>
                </h3>
                <p>{t(isPortal ? 'content.invoker.portalBody' : 'content.invoker.gitBody')}</p>
                {!isPortal && <code>{GIT_INVOKER_REPO}</code>}
            </div>
            <Tooltip content={blockReason ? tCommon(ONLINE_FEATURE_REASON_KEY[blockReason]) : ''}>
                <Button
                    type="default"
                    loading={isRunning}
                    disabled={isRunning || availability.state !== 'available'}
                    testId={isPortal ? 'onboarding-invoker-portal' : 'onboarding-invoker-git'}
                    onClick={() => void run()}
                >
                    {t(isPortal ? 'content.invoker.portalAction' : 'content.invoker.gitAction')}
                </Button>
            </Tooltip>
        </section>
    )
}
